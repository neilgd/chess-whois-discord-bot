import { REST, Routes } from "discord.js";
import { commands } from "./commands/index";
import dotenv from "dotenv";
dotenv.config();

const { DISCORD_TOKEN, DISCORD_APP_ID, DISCORD_SERVER_ID } = process.env;

const commandsData = Object.values(commands).map((command) => command.data);
const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN!);
const testing = true;

 deployCommands().then(()=>console.log("Deployed!"));

async function deployCommands() {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(

      testing?Routes.applicationGuildCommands(DISCORD_APP_ID!,DISCORD_SERVER_ID! ):Routes.applicationCommands(DISCORD_APP_ID!),
      {
        body: commandsData,
      }
    );

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
}
