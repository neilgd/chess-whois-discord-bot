//console.log('Handler loaded');

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
  APIPingInteraction
} from 'discord-api-types/v10';

import {commands} from './commands/index';
import { CommandInteraction, Interaction, InteractionResponseType } from 'discord.js';


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

  //console.log("Verifying request");

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
  
  //console.log('Interaction', interaction);

  // 1) Handle PING – required for Discord to accept your endpoint URL
  if (interaction.type === InteractionType.Ping) {
    return jsonResponse({
      type: InteractionResponseType.Pong,
    });
  }

  // 2) Handle slash commands (APPLICATION_COMMAND)
  if (interaction.type === InteractionType.ApplicationCommand) {
   
      const cmd = interaction as APIApplicationCommandInteraction;
      const name = cmd.data.name;         // fully typed

      //console.log('Command name:', name);

    switch (name) {
      case 'whois':
		{
			const response = await commands.whois.execute(cmd);
			return jsonResponse(response);
		}
      default:
        return jsonResponse({
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: `Unknown command: \`${name ?? '???'}\``,
            flags: 64, // ephemeral
          },
        });
    }
  }

  // 3) Other interaction types (buttons, modals, etc.) could go here
  return {
    statusCode: 400,
    body: 'Unhandled interaction type',
  };
};

function jsonResponse(body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}
