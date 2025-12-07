import { APIApplicationCommandInteraction, APIApplicationCommandInteractionDataBasicOption, APIApplicationCommandInteractionDataUserOption, APIChatInputApplicationCommandInteraction, APIChatInputApplicationCommandInteractionData, APIContextMenuInteraction, APIUser, APIUserApplicationCommandInteraction, APIUserApplicationCommandInteractionData, ApplicationCommandOptionType, ApplicationCommandType, ApplicationIntegrationType, AttachmentBuilder, CommandInteraction, ContextMenuCommandBuilder, InteractionContextType, InteractionType, MessageFlags, SlashCommandBuilder, UserContextMenuCommandInteraction } from "discord.js";
import { readDynamoLookUp } from "./dynamo";

export async function userDescription(discordUserId: string, interaction: APIChatInputApplicationCommandInteraction | APIApplicationCommandInteraction )
{ 


	let mainName: string | null | undefined;
	let nick: string| null | undefined;
	let secondName: string | undefined;
	let lichessId : string | undefined;
	let ccId : string | undefined;
	let dojoId: string | undefined;
	let dojoName: string | undefined;

	let inLadder = false;

	const data = interaction.data.type==ApplicationCommandType.ChatInput?
	(interaction.data as APIChatInputApplicationCommandInteractionData):(interaction.data as APIUserApplicationCommandInteractionData);


	const i = interaction as APIApplicationCommandInteraction;

	const resolvedUser = data.resolved!.users![discordUserId];
	secondName = resolvedUser.username;
	mainName = resolvedUser.global_name;

	if (!mainName)
	{
		mainName = secondName;
	}

	const members = data.resolved!.members;

	if (members)
	{
		const resolvedMember = members[discordUserId]!;
		nick = resolvedMember.nick;
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

	//look up from DynamoDB

	const d = await readDynamoLookUp(discordUserId);

	if (d)
	{
		lichessId = d.lichessId;
		ccId = d.ccId;
	}

	const l2  = await getLichessLadderInfo(discordUserId);

	if (l2)
	{
		inLadder = true;
		lichessId = l2;
	}

	const l3 = await getDojoInfo(discordUserId);

	if (l3)
	{
		dojoId = l3.username;
		dojoName = l3.displayName;

		if (l3.ratings)
		{
			if (!lichessId)
			{
				lichessId=l3.ratings?.LICHESS?.username;
			}
			if (!ccId)
			{
				ccId = l3.ratings.CHESSCOM?.username;
			}
		}

	}


	if (lichessId)
	{
		description+=`**Lichess**: [${lichessId}](<https://lichess.org/@/${lichessId}>)\r\n`;
	}

	if (ccId)
	{
		description+=`**Chess.com**: [${ccId}](<https://chess.com/member/${ccId}>)\r\n`;
	}

	if (dojoId)
	{
		description+=`**ChessDojo**: [${dojoName}](https://www.chessdojo.club/profile/${dojoId}>)\r\n`;
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

async function getDojoInfo(discordUserId: string)
{
	const url = `https://g4shdaq6ug.execute-api.us-east-1.amazonaws.com/public/user/discord/${discordUserId}`;
	const res = await fetch(url, {
		method: "GET",
		headers: {
			"Accept": "application/json"
		}
		});

		if (!res.ok) {
			console.error("Error retrieving Dojo info");
			console.error(await res.text());
			return null;
		}

		return await res.json();

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
		console.error("Error retrieving ladder info");
		console.error(await res.text());
		return null;

	}

	const data : any [] = await res.json();

	if (data.length!=0)
	{
		return data[0].lichessId;
	}

	return null;
}

