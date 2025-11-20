// user context menus
import { InteractionResponseType } from "discord-interactions";
import { APIApplicationCommandInteraction, APIApplicationCommandInteractionDataBasicOption, APIApplicationCommandInteractionDataUserOption, APIContextMenuInteraction, ApplicationCommandOptionType, ApplicationCommandType, ApplicationIntegrationType, AttachmentBuilder, CommandInteraction, ContextMenuCommandBuilder, InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";
import { userDescription } from "../user-description";

//these interaction types and contexts mean it can be installed in servers
//but also by users, and appear in their DMs

export const data = new ContextMenuCommandBuilder()
  .setName("Chess whois")
  .setType(ApplicationCommandType.User)
  .setIntegrationTypes([ApplicationIntegrationType.UserInstall, ApplicationIntegrationType.GuildInstall])
  .setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]);  

export async function execute(interaction: APIApplicationCommandInteraction) {

  if (interaction.data.type !== ApplicationCommandType.User) {
	//this shouldn't happen
	return;
  }

  const userId  = interaction.data.target_id;

	  return {
	  type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
	  data:  {
		content: await userDescription(userId, interaction as APIContextMenuInteraction)
	  } 
  

}
}
