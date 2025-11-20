import { APIApplicationCommandInteraction, APIApplicationCommandInteractionDataBasicOption, APIApplicationCommandInteractionDataUserOption, APIChatInputApplicationCommandInteraction, APIContextMenuInteraction, APIUser, APIUserApplicationCommandInteraction, APIUserApplicationCommandInteractionData, ApplicationCommandOptionType, ApplicationCommandType, ApplicationIntegrationType, AttachmentBuilder, CommandInteraction, ContextMenuCommandBuilder, InteractionContextType, InteractionType, MessageFlags, SlashCommandBuilder, UserContextMenuCommandInteraction } from "discord.js";

export async function userDescription(discordUserId: string, interaction: APIChatInputApplicationCommandInteraction | APIApplicationCommandInteraction )
{ 


	let mainName: string | null | undefined;
	let nick: string| null | undefined;
	let secondName: string | undefined;
	let lichessId : string | undefined;
	let inLadder = false;

	if (interaction)
	if (interaction.data.type==ApplicationCommandType.ChatInput)
	{
		//this is the slashcommand so we need to retrieve the information from the resolved data passed in with the interaction
		const i = interaction as APIChatInputApplicationCommandInteraction;
		const resolvedUser= i.data.resolved!.users![discordUserId]!;
		const resolvedMember = i.data.resolved!.members![discordUserId]!;
		mainName = resolvedUser.global_name;
		nick = resolvedMember.nick;
		secondName = resolvedUser.username;
	}

	if (interaction.data.type==ApplicationCommandType.User)
	{
		//user context menu

		const data = interaction.data as APIUserApplicationCommandInteractionData;
		const i = interaction as APIApplicationCommandInteraction;

		mainName = i.member?.user.global_name;
		secondName = i.member?.user?.username;
		nick = i.member?.nick;

	}

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
	let description = '';

	lichessId = await getLichessLadderInfo(discordUserId);

	if (lichessId)
	{
		inLadder = true;
	}

	if (lichessId)
	{
		description+=`**Lichess**: [${lichessId}](<https://lichess.org/@/${lichessId}>)\r\n`;
	}

	if (inLadder)
	{
		description+=`**Lichess Ladders**: [${lichessId}](<https://lichessladders.com/@/${lichessId}>)\r\n`;
	}

	if (description)
	{
		description=`Here are the details for ${discordName}:\r\n${description}`;
	}
	else
	{
		description=`No details found for ${discordName}`;
	}

	return description;

}

async function getLichessLadderInfo(discordUserId: string)
{
	
	const url = `https://api.lichessladders.com/users/search?discordId=${discordUserId}`;

	const res = await fetch(url, {
	method: "GET",
	headers: {
		"Accept": "application/json"
	}
	});

	if (!res.ok) {
		console.error(await res.text());
		 throw Error("Couldn't get data from Lichess ladders");
	}

	const data : any [] = await res.json();

	if (data.length!=0)
	{
		return data[0].lichessId;
	}

	return null;
}

