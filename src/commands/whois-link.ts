// /whois slash command

import { InteractionResponseType } from "discord-interactions";
import { APIApplicationCommandInteraction, APIApplicationCommandInteractionDataBasicOption, APIApplicationCommandInteractionDataUserOption, APIChatInputApplicationCommandInteraction, ApplicationCommandOptionType, ApplicationCommandType, ApplicationIntegrationType, AttachmentBuilder, CommandInteraction, InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";
import { updateCcId, updateLichessId } from "../dynamo";

//these interaction types and contexts mean it can be installed in servers
//but also by users, and appear in their DMs
export const data = new SlashCommandBuilder()
  .setName("whois-link")
  .setDescription("Link your Lichess and chess.com usernames to your Discord id so people can look you up")
  .setIntegrationTypes([ApplicationIntegrationType.UserInstall, ApplicationIntegrationType.GuildInstall])
  .setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel])
  .addStringOption(option => 
    option.setName('lichess-id')
      .setDescription('Your Lichess username')
      .setRequired(false))
	.addStringOption(option => 
    option.setName('cc-id')
      .setDescription('Your chess.com username')
      .setRequired(false)
	
  )  

export async function execute(interaction: APIApplicationCommandInteraction) {

  if (interaction.data.type !== ApplicationCommandType.ChatInput) {
    //this shouldn't happen
    return;
  }

	const options  = interaction.data.options??[];
	const lichessOption: APIApplicationCommandInteractionDataUserOption = options.find(opt => opt.name === 'lichess-id') as APIApplicationCommandInteractionDataUserOption;
	const ccOption: APIApplicationCommandInteractionDataUserOption = options.find(opt => opt.name === 'cc-id') as APIApplicationCommandInteractionDataUserOption;

  if (!lichessOption && !ccOption){
 		return `❌ Please give either your lichess or chess.com username`;
  }

  const myId = interaction.member?.user.id!;

  if (lichessOption && lichessOption.value)
	{
		await updateLichessId(myId, lichessOption.value);
	}

  if (ccOption && ccOption.value)
	{
		await updateCcId(myId, ccOption.value);
	}

   return "Your data has been stored";

}
