import {config} from 'dotenv';
import * as REST from "@discordjs/rest";
import {Routes} from "discord-api-types/v9";
import {SlashCommandBuilder} from "@discordjs/builders";

config();
// Place your client and guild ids here
const clientId = '921269713345069077';
const guildId = process.env.DISCORD_GUILD_ID;
if (typeof guildId !== 'string') {
  throw new Error("Guild ID missing")
}
const botToken = process.env.DISCORD_TOKEN;
if (typeof botToken !== 'string') {
  throw new Error("Bot Token missing")
}

const data = new SlashCommandBuilder()
  .setName('rename')
  .setDescription('Renames the user')
  .addUserOption(option => {
    return option.setName('user').setDescription('the user to rename').setRequired(true)
  })
  .addStringOption(option =>
    option.setName('name')
      .setDescription('The new user name')
      .setRequired(true));


const rest = new REST.REST({version: '9'}).setToken(botToken);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      {body: [data.toJSON()]},
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
