import { InteractionResponseType } from "discord-interactions";
import { APIApplicationCommandInteraction, APIApplicationCommandInteractionDataBasicOption, APIApplicationCommandInteractionDataUserOption, ApplicationCommandOptionType, ApplicationCommandType, ApplicationIntegrationType, AttachmentBuilder, CommandInteraction, InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";

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
function getUserId(interaction: APIApplicationCommandInteraction)
{
    if (interaction.data.type !== ApplicationCommandType.ChatInput) {
    //this shouldn't happen
    return;
  }

  const options  = interaction.data.options??[];
  const option: APIApplicationCommandInteractionDataBasicOption = options.find(opt => opt.name === 'user-name') as APIApplicationCommandInteractionDataBasicOption;

  if (!option){
    return null;
  }

  const value = option.value as string;

   return value;
}



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

  if (!option.value) {  
     return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data:  {
        content:`❌ This is not a valid user Id.`,
        flags: MessageFlags.Ephemeral
      } 
    };
  }   

  const res = await fetch(`https://api.lichessladders.com/users/search?discordId=${option.value}`, {
  method: "GET",
  headers: {
    "Accept": "application/json"
  }
});

if (!res.ok) {
  console.error(await res.text());
      return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data:  {
        content:`There was a problem`,
        flags: MessageFlags.Ephemeral
      } 
  }
}

const data : any [] = await res.json();

if (data.length==0)
{
     return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data:  {
        content:`That user wasn't found in the ladders.`,
        flags: MessageFlags.Ephemeral
      } 
  }
}

  const id = data[0].lichessId;

  const resolvedUser = interaction.data.resolved!.users![option.value]!;
  const resolvedMember = interaction.data.resolved!.members![option.value]!;

  const mainName = resolvedUser.global_name;
  const nick = resolvedMember.nick;
  const secondName = resolvedUser.username;

  const mainLower = mainName?.toLowerCase();
  const secondLower = secondName?.toLowerCase();

  let extraNames = (mainLower!=secondLower && !!secondName)?secondName:"";
  if (nick)
  {
    const nickLower = nick?.toLowerCase();

    if (nickLower!=mainLower && nickLower!=secondLower)
    {
        extraNames = extraNames + ((extraNames.length!=0)?"/":"") + nick;
    }
  }

  const discordName = `*${mainName}*${((extraNames.length==0)?"":` (aka ${extraNames})`)}`;



      return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data:  {
        content:`${discordName}'s Lichess username is ${id}. You can view their ladder profile at <https://lichessladders.com/@/${id}>. Their Lichess page is <https://lichess.org/@/${id}>`,
        flags: MessageFlags.Ephemeral
      } 
  

}
}
