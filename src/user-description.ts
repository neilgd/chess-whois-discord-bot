import { APIApplicationCommandInteraction, APIChatInputApplicationCommandInteraction, APIChatInputApplicationCommandInteractionData, APIUserApplicationCommandInteractionData, ApplicationCommandType } from "discord.js";
import { readDynamoLookUp } from "./dynamo";

type Rating =
{
	rating: number,
	isProvisional: boolean
}

type Ratings =
{
	blitz?: Rating,
	rapid?: Rating,
	classical?:Rating
}

export async function userDescriptionFromDiscordUserId(discordUserId: string)
{
	let lichessId : string | undefined;
	let ccId : string | undefined;
	let dojoId: string | undefined;
	let dojoName: string | undefined;

	let inLadder = false;
	let description = '';

	//look up from DynamoDB
	//could do all the look ups in parallel but not really worth the complexity
	
	const d = await readDynamoLookUp(discordUserId);
	//console.timeLog();
	//console.log("Got from Dynamo DB");

	if (d)
	{
		lichessId = d.lichessId;
		ccId = d.ccId;
	}

	const l2  = await getLichessLadderInfo(discordUserId);
	//console.timeLog();
	//console.log("Got from ladder");

	if (l2)
	{
		inLadder = true;
		lichessId = l2;
	}

	const l3 = await getDojoInfo(discordUserId);

	//console.timeLog();
	//console.log("Got from Dojo");

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

	const lichessRatings = lichessId?await getLichessRatings(lichessId):undefined;
	const ccRatings = ccId?await getCCRatings(ccId):undefined;

	const lichessRatingsString = ratingsString(lichessRatings);
	const ccRatingsString = ratingsString(ccRatings);


	if (lichessId)
	{
		description+=`**Lichess**: [${lichessId}](<https://lichess.org/@/${lichessId}>)${lichessRatingsString?`\r\n    ${lichessRatingsString}`:``}\r\n`;
	}

	if (ccId)
	{
		description+=`**Chess.com**: [${ccId}](<https://chess.com/member/${ccId}>)${ccRatingsString?`\r\n    ${ccRatingsString}`:``}\r\n`;
	}

	if (dojoId)
	{
		description+=`**ChessDojo**: [${dojoName}](<https://www.chessdojo.club/profile/${dojoId}>)\r\n`;
	}

	if (inLadder)
	{
		description+=`**Lichess Ladders**: [${lichessId}](<https://lichessladders.com/@/${lichessId}>)\r\n`;
	}

	return description;

}

function ratingsString(ratings?: Ratings | null)
{
	function singleString(icon:string, rating?: Rating)
	{
		if (!rating)
		{
			return undefined;
		}
		return `${icon}${rating.rating}${rating.isProvisional?'?':''}`;
	}

	if (!ratingsString)
	{
		return undefined;
	}

	const ret: (string | undefined)[]= [];
	ret.push(singleString('⚡',ratings?.blitz));
	ret.push(singleString('🐇',ratings?.rapid));
	ret.push(singleString('🐢',ratings?.classical));

	if (ret.length==0)
	{ 
		return null;
	}	

	const retString = ret.filter(x=>!!x).join('  ');
	return retString;

}

export async function userDescription(discordUserId: string, interaction: APIChatInputApplicationCommandInteraction | APIApplicationCommandInteraction )
{ 

	//console.timeLog();
	//console.log("Getting user description");

	let mainName: string | null | undefined;
	let nick: string| null | undefined;
	let secondName: string | undefined;


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

	let description = await userDescriptionFromDiscordUserId(discordUserId);

	if (description)
	{
		description=`Here are the details for ${discordName}:\r\n${description}`;
	}
	else
	{
		description=`No details found for ${discordName}`;
	}

//	console.timeLog();
//	console.log("Got description");
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
	
	const url = `https://api.lichessladders.com/users/discord/${discordUserId}`;

	const res = await fetch(url, {
	method: "GET",
	headers: {
		"Accept": "application/json"
	}
	});

	if (!res.ok) {
		if (res.status==404)
		{
			return null;
		}
		console.error("Error retrieving ladder info");
		console.error(await res.text());
		return null;
	}

	const data : any = await res.json();

	return data.lichessId;
}

async function getLichessRatings(lichessId: string)
{

	function getRating(category:any) : Rating | undefined
	{
		if (!category)
		{
			return undefined;
		}

		//console.log(category);
		return {rating: category.rating, isProvisional: !!category.prov};

	}
	const url = `https://lichess.org/api/user/${lichessId}`;
	const res = await fetch(url, {headers: { "Accept": "application/json" }});

	if (!res.ok) {
		console.error(`Lichess API error: ${res.status} ${res.statusText}`);
		return null;
	}

	const data = await res.json();

	const perfs = data?.perfs;

	let ratings: Ratings =
	{
		blitz: getRating(perfs?.blitz),
		rapid: getRating(perfs?.rapid),
		classical: getRating(perfs?.classical)
	}

	return ratings;

}

async function getCCRatings(ccId: string)
{

	function getRating(category:any) : Rating | undefined
	{
		if (!category)
		{
			return undefined;
		}

		//use the Lichess system of rd<110 == provisional

		return {rating: category.last?.rating, isProvisional: category.last?.rd>=110};

	}
	const url = `https://api.chess.com/pub/player/${ccId}/stats`;


	const res = await fetch(url, {headers: { "Accept": "application/json" }});

	if (!res.ok) {
		console.error(`Chess API error: ${res.status} ${res.statusText}`);
		return null;
	}

	const data = (await res.json());

	let ratings: Ratings =
	{
		blitz: getRating(data?.chess_blitz),
		rapid: getRating(data?.chess_rapid)	
	}

	return ratings;
}
