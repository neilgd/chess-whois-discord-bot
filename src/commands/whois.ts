import { InteractionResponseType } from "discord-interactions";
import { APIApplicationCommandInteraction, APIApplicationCommandInteractionDataBasicOption, ApplicationCommandOptionType, ApplicationCommandType, AttachmentBuilder, CommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";


const fenRegex = /^(?:[prnbqkPRNBQK1-8]+\/){7}[prnbqkPRNBQK1-8]+\s[wb]\s(?:[KQkq]{1,4}|-)\s(?:[a-h][36]|-)\s\d+\s\d+$/;

export const data = new SlashCommandBuilder()
  .setName("whois")
  .setDescription("Find the lichess username from a Discord user")
  .addUserOption(option => 
    option.setName('user-name')
      .setDescription('The Discord user')
      .setRequired(true)
  );
  
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
const userId = getUserId(interaction);

  if (!userId) {  
     return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data:  {
        content:`❌ This is not a valid user Id.`,
        flags: MessageFlags.Ephemeral
      } 
    };
  }   

  const res = await fetch(`https://api.lichessladders.com/users/search?discordId=${userId}`, {
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

      return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data:  {
        content:`You can view the user at <https://lichessladders.com/@/${id}>. Their Lichess page is <https://lichess.org/@/${id}>`,
        flags: MessageFlags.Ephemeral
      } 
  

}
}

  //await replyToDiscord(fen, interaction.token);
/*
  return {
      type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    };
}*/

 
