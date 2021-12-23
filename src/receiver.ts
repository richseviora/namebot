import { config } from "dotenv";
import { Client, Intents } from "discord.js";
import * as Discord from "discord.js";
import BetterLogger from "better-logging";

BetterLogger(console);
config();

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

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, guild, user, options } = interaction;

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

  function postNotificationToChannel(request: INameChangeRequest): void {
    try {
      const channel = interaction.guild?.channels.cache.find(
        (channel) => channel.name.toLowerCase() === notificationChannelName
      );
      if (channel?.isText()) {
        channel.send(
          `${request.requester.tag} changed ${request.target.tag}'s username to ${request.nickName}`
        );
        console.debug("notification posted", {
          channel: notificationChannelName,
        });
      } else {
        console.warn("channel not found", { channel: notificationChannelName });
      }
    } catch (e) {
      console.error(
        "Received error trying to post name change notification",
        e
      );
    }
  }

  if (commandName === "rename") {
    const request = {
      requester: user,
      target: options.getUser("user"),
      nickName: options.getString("name"),
    } as INameChangeRequest;

    if (request.target == null || request.nickName == null) {
      console.warn("missing target or nickname");
      await interaction.reply({
        content: "missing either name or user",
        ephemeral: true,
      });
      return;
    }

    if (guild.ownerId === request.target.id) {
      console.info("user attempted to change owner's nickname");
      await interaction.reply({
        content: "can't change the server owner's username, sorry :(",
        ephemeral: true,
      });
      return;
    }

    const guildMembers = guild.members;

    try {
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
      postNotificationToChannel(request);
      await interaction.reply(replyOptions);
      console.debug(`sent confirmation response`);
    } catch (e) {
      console.error(e);
    }
  }
});

client.login(discordToken);
