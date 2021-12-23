import {config} from 'dotenv';
import {Client, Intents} from "discord.js";


config();

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

if (typeof process.env.DISCORD_TOKEN !== 'string') {
  throw new Error("No Discord Token provided");
}

client.once('ready', () => {
  console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'rename') {
    await interaction.reply('Pong!');
  }
});

client.login(process.env.DISCORD_TOKEN);
