import { config } from "dotenv";
import { Client, Intents } from "discord.js";
import * as Discord from "discord.js";
import BetterLogger from "better-logging";

BetterLogger(console);
config();

import "./tracing";
import opentelemetry, { Span } from "@opentelemetry/api";

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const ephemeralMessages = process.env.DISCORD_HIDDEN != null;
const notificationChannelName = process.env.DISCORD_NAME_CHANNEL;
const discordToken = process.env.DISCORD_TOKEN;

if (typeof discordToken !== "string") {
  throw new Error("No Discord Token provided");
}

interface INameChangeRequest {
  requester: Discord.User;
  target: Discord.User;
  nickName: string;
}

client.once("ready", () => {
  console.info("Ready!", {
    ephemeralMessages,
    nameChannel: notificationChannelName,
  });
});

const tracer = opentelemetry.trace.getTracer("default");

async function interactionReply(
  interaction: Discord.CommandInteraction,
  options: Discord.InteractionReplyOptions
): Promise<void> {
  const span = tracer.startSpan("interactionReply");
  span.setAttributes({
    content: options.content || "not set",
    ephemeral: options.ephemeral,
  });
  await interaction.reply(options);
  span.end();
}

async function postNotificationToChannel(
  interaction: Discord.CommandInteraction,
  request: INameChangeRequest
): Promise<void> {
  const span = tracer.startSpan("postNotification");
  try {
    const channel = interaction.guild?.channels.cache.find(
      (channel) => channel.name.toLowerCase() === notificationChannelName
    );
    if (channel?.isText()) {
      const message = `${request.requester.tag} changed ${request.target.tag}'s username to ${request.nickName}`;
      span.setAttributes({ message });
      await channel.send(message);
      console.debug("notification posted", {
        channel: notificationChannelName,
      });
    } else {
      console.warn("channel not found", { channel: notificationChannelName });
    }
  } catch (e) {
    console.error("Received error trying to post name change notification", e);
  } finally {
    span.end();
  }
}

async function handleRename(
  guild: Discord.Guild | null,
  user: Discord.User,
  interaction: Discord.CommandInteraction,
  span: Span
) {
  try {
    const { options } = interaction;
    if (guild == null) {
      console.warn("no guild assigned somehow", {
        user: user.tag,
      });
      await interaction.reply({
        content: "not in guild context or something",
        ephemeral: true,
      });
      return;
    }

    const request = {
      requester: user,
      target: options.getUser("user"),
      nickName: options.getString("name"),
    } as INameChangeRequest;

    if (request.target == null || request.nickName == null) {
      console.warn("missing target or nickname");
      await interactionReply(interaction, {
        content: "missing either name or user",
        ephemeral: true,
      });
      return;
    }

    span.setAttributes({
      targetUser: request.target.tag,
      existingName: request.target.username,
      newName: request.nickName,
    });

    if (guild.ownerId === request.target.id) {
      console.info("user attempted to change owner's nickname");
      await interactionReply(interaction, {
        content: "can't change the server owner's username, sorry :(",
        ephemeral: true,
      });
      return;
    }

    const guildMembers = guild.members;

    console.debug("updating target name");
    await guildMembers.edit(
      request.target,
      {
        nick: request.nickName,
      },
      `name change requested by ${request.requester.tag}`
    );
    console.info(
      `updated target ${request.requester.tag} nickname to ${request.nickName}`
    );
    const replyOptions = ephemeralMessages
      ? {
          content: "username changed!",
          ephemeral: true,
        }
      : {
          content: `${request.requester.tag} changed ${request.target.tag}'s nickname to "${request.nickName}"`,
          ephemeral: false,
        };
    await postNotificationToChannel(interaction, request);
    await interactionReply(interaction, replyOptions);
    console.debug(`sent confirmation response`);
  } catch (e) {
    console.error(e);
  } finally {
    span.end();
  }
}

client.on("interactionCreate", async (interaction) => {
  const span = tracer.startSpan("interactionCreate");
  if (!interaction.isCommand()) return;

  const { commandName, guild, user } = interaction;

  span.setAttributes({
    user: user.tag,
    guild: guild?.id,
    command: commandName,
    notificationChannel: notificationChannelName,
  });

  if (commandName === "rename")
    await handleRename(guild, user, interaction, span);
});

client.login(discordToken);
