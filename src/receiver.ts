import { config } from "dotenv";
import { Client, Intents } from "discord.js";
import * as Discord from "discord.js";

config();

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const ephemeralMessages = process.env.DISCORD_HIDDEN != null;

if (typeof process.env.DISCORD_TOKEN !== "string") {
  throw new Error("No Discord Token provided");
}

interface INameChangeRequest {
  requester: Discord.User;
  target: Discord.User;
  nickName: string;
}

client.once("ready", () => {
  console.log("Ready!");
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, guild, user, options } = interaction;

  if (guild == null) {
    await interaction.reply({
      content: "not in guild context or something",
      ephemeral: true,
    });
    return;
  }

  function postNotificationToChannel(request: INameChangeRequest): void {
    try {
      const channel = interaction.guild?.channels.cache.find(
        (channel) => channel.name.toLowerCase() === process.env.DISCORD_NAME_CHANNEL
      );
      console.info("channel", channel);
      if (channel?.isText()) {
        channel.send(
          `${request.requester.tag} changed ${request.target.tag}'s to username to ${request.nickName}`
        );
      }
    } catch (e) {
      console.error("Received error trying to post name change notification");
    }
  }

  if (commandName === "rename") {
    const request = {
      requester: user,
      target: options.getUser("user"),
      nickName: options.getString("name"),
    } as INameChangeRequest;

    if (request.target == null || request.nickName == null) {
      await interaction.reply({
        content: "missing either name or user",
        ephemeral: true,
      });
      return;
    }

    if (guild.ownerId === request.target.id) {
      await interaction.reply({
        content: "can't change the server owner's username, sorry :(",
        ephemeral: true,
      });
      return;
    }

    const guildMembers = guild.members;

    try {
      await guildMembers.edit(
        request.target,
        {
          nick: request.nickName,
        },
        `name change requested by ${request.requester.tag}`
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
      console.info(
        `changed username ${request.requester.tag} to ${request.nickName}`
      );
      postNotificationToChannel(request);
      await interaction.reply(replyOptions);
      console.info(`sent confirmation response`);
    } catch (e) {
      console.error(e);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
