//this is as lambda function called in slow time by the original lambda function
//it doesn't have an http endpoint - it's called directly

import { APIInteraction, InteractionType, APIApplicationCommandInteraction, ApplicationCommandType } from "discord.js";
import { commands } from "./commands";

export const handler = async (event: any)=> {

	const rawBody = event.rawBody as string;
	console.log(rawBody);

  	const interaction = JSON.parse(rawBody) as APIInteraction;

	console.log(interaction);

	try
	{
	switch (interaction.type)
	  {
		
			case InteractionType.ApplicationCommand:
				
				const cmd = interaction as APIApplicationCommandInteraction;
				
				switch (cmd.data.type)
					{
						case ApplicationCommandType.User:
							const response = await commands.userWhois.execute(cmd);
							await sendResponseToDiscord(response)
						case ApplicationCommandType.ChatInput:
							const name = cmd.data.name; 
	
							switch (name) {
								case 'whois':
									{
										const response = await commands.whois.execute(cmd);
										await sendResponseToDiscord(response);										
									}
								case 'whois-link':
									{
										const response = await commands.whoisLink.execute(cmd);
										await sendResponseToDiscord(response);
										
									}
							}
						}
		}
	
		return { statusCode:400,body:"unknown command"};
	}

	catch (e)
	{
		console.error(e);
		const url = `https://discord.com/api/v10/webhooks/${process.env.DISCORD_APP_ID!}/${interaction.token}/messages/@original`;

		//console.log("Sending reply...", url);

		const r = await fetch(url, {
			method: 'PATCH',
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
			content: "❌ An error occurred while processing your request.",
			flags: 64 // optional: mark ephemeral
			})
		});

	}

	
	async function sendResponseToDiscord(content?: string)
	{
		  const url = `https://discord.com/api/v10/webhooks/${process.env.DISCORD_APP_ID!}/${interaction.token}`;

			const r = await fetch(url, {
			method: 'PATCH',
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
			content:content,
			flags: 64 // optional: mark ephemeral
			})
		});
	}

	

}

