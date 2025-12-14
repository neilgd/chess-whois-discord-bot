// /whois slash command

import { InteractionResponseType } from "discord-interactions";
import { APIApplicationCommandInteraction, APIApplicationCommandInteractionDataBasicOption, APIApplicationCommandInteractionDataUserOption, APIChatInputApplicationCommandInteraction, ApplicationCommandOptionType, ApplicationCommandType, ApplicationIntegrationType, AttachmentBuilder, CommandInteraction, InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";
import { userDescription } from "../user-description";

//these interaction types and contexts mean it can be installed in servers
//but also by users, and appear in their DMs
export const data = new SlashCommandBuilder()
  .setName("whois")
  .setDescription("Find the lichess username from a Discord user")
  .setIntegrationTypes([ApplicationIntegrationType.UserInstall, ApplicationIntegrationType.GuildInstall])
  .setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel])
  .addUserOption(option => 
    option.setName('user-name')
      .setDescription('The Discord user')
      .setRequired(true)
	
  )  

export async function execute(interaction: APIApplicationCommandInteraction) {


  if (interaction.data.type !== ApplicationCommandType.ChatInput) {
    //this shouldn't happen
    return;
  }

	const options  = interaction.data.options??[];
	const option: APIApplicationCommandInteractionDataUserOption = options.find(opt => opt.name === 'user-name') as APIApplicationCommandInteractionDataUserOption;

  if (!option){
    return;
  }


  if (!option.value) 
	{  
	return "❌ This is not a valid user Id.";
	}

	return await userDescription(option.value, interaction as APIChatInputApplicationCommandInteraction);

}
