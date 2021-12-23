import { config } from "dotenv";
import { Client, Intents } from "discord.js";

config();

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const ephemeralMessages = process.env.DISCORD_HIDDEN != null;

if (typeof process.env.DISCORD_TOKEN !== "string") {
  throw new Error("No Discord Token provided");
}

client.once("ready", () => {
  console.log("Ready!");
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === "rename") {
    const targetUser = interaction.options.getUser("user");
    const newName = interaction.options.getString("name");
    const guild = interaction.guild;

    if (targetUser == null || newName == null) {
      await interaction.reply({
        content: "missing either name or user",
        ephemeral: true,
      });
      return;
    }
    if (guild == null) {
      await interaction.reply({
        content: "not in guild context or something",
        ephemeral: true,
      });
      return;
    }
    if (guild.ownerId === targetUser.id) {
      await interaction.reply({
        content: "can't change the server owner's username, sorry :(",
        ephemeral: true,
      });
      return;
    }

    const guildMembers = guild.members;

    try {
      await guildMembers.edit(targetUser, {
        nick: newName,
      });
      await interaction.reply({
        content: "changed!",
        ephemeral: ephemeralMessages,
      });
    } catch (e) {
      console.error(e);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
