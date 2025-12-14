//console.log('Handler loaded');

//console.time();
//console.log("Importing");

import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import {
  verifyKey
} from 'discord-interactions';

import {
  APIInteraction,
  InteractionType,
  APIApplicationCommandInteraction,
  APIPingInteraction,
  ApplicationCommandType
} from 'discord-api-types/v10';

import {commands} from './commands/index';
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

import { InteractionResponseType } from "discord-interactions";

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!;

//console.log('Public key length:', PUBLIC_KEY.length);

function getHeader(headers: Record<string, string | undefined>, name: string): string | undefined {
  // Cope with different casing from API Gateway / Function URLs
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === lower) return v;
  }
  return undefined;
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  // Only accept POST
  //console.log('In handler', event.requestContext.http.method);

  if (event.requestContext.http.method !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  //console.log('Reading signature headers and body');

  const signature = getHeader(event.headers, 'x-signature-ed25519');
  const timestamp = getHeader(event.headers, 'x-signature-timestamp');

  // Get **raw** body – must match what Discord signed
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : (event.body || '');

  if (!signature || !timestamp || !rawBody) {
    return {
      statusCode: 401,
      body: 'invalid request signature',
    };
  }

 // console.timeLog();
  console.log("Verifying request");

  
  // Verify request
  let valid = false;
  try {
    valid = await verifyKey(rawBody, signature, timestamp, PUBLIC_KEY);
  } catch (err) {
    console.error('verifyKey error', err);
    valid = false;
  }

  if (!valid) {
    return {
      statusCode: 401,
      body: 'invalid request signature',
    };
  }

  
  // At this point, we trust the request
  const interaction = JSON.parse(rawBody) as APIInteraction;
  
//  console.timeLog();
  //console.log("Running request");

  //console.log(interaction.type);

  switch (interaction.type)
  {
		case InteractionType.Ping:
			return jsonResponse({
			type: InteractionResponseType.PONG,
			});
		case InteractionType.ApplicationCommand:
			
			const cmd = interaction as APIApplicationCommandInteraction;
			
			switch (cmd.data.type)
				{
					case ApplicationCommandType.User:
						const response = await commands.userWhois.execute(cmd);
						return jsonResponse(response);
          default:
            {
              //console.log("Command received");
            //fire a lambda function and defer the response
            
            const command = new InvokeCommand({
              FunctionName: "chess-whois-discord-bot-reply",
              Payload: Buffer.from(rawBody),
              InvocationType: "Event" // don't wait for response
              //InvocationType: "RequestResponse" // wait for response
            });

            const lambda = new LambdaClient({});

            const response = await lambda.send(command);
            //console.log("Lambda invoked:", response);
            
            if (response.FunctionError=="Unhandled")
            {
              const error = JSON.parse(Buffer.from(response.Payload!).toString());
              console.error(error.errorType, error.errorMessage);
              console.error(error.stackTrace);
            }

            //console.log("Deferring response");
            return jsonResponse({type:InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE})
					}
        }
	}

	return { statusCode:400,body:"unknown command"};
}


function jsonResponse(body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}
