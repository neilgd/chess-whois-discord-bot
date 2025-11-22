import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

import dotenv from "dotenv";
dotenv.config();

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE = process.env.DYNAMO_TABLE??"chess-who-is-lookup";

// READ (GetItem)
export async function readDynamoLookUp(discordId: string) {
  const res = await docClient.send(new GetCommand({
    TableName: TABLE,
    Key: { discordId },
  }));

  return res.Item; // Already unmarshalled JS object
}

// WRITE (PutItem)
export async function writeDynamoLookup(discordId: string, lichessId: string, ccId: string) {
	console.log("DISCORD-ID", discordId);
  await docClient.send(new PutCommand({
    TableName: TABLE,
    Item: {
	discordId,
      lichessId,
	  ccId,
      updatedAt: Date.now(),
    },
  }));
}

export async function updateLichessId(discordId: string, lichessId: string) {
	await updateId(discordId, "lichessId", lichessId);
}

async function updateId(discordId: string, key:string, value: string)
{

 await docClient.send(new UpdateCommand({
    TableName: TABLE,
    Key: { discordId },
    UpdateExpression: "SET #key = :value",
    ExpressionAttributeNames: {
      "#key": key,
    },
    ExpressionAttributeValues: {
      ":value": value,
    },
    ReturnValues: "ALL_NEW",
  }));
}

export async function updateCcId(discordId: string, ccId: string) {
	await updateId(discordId, "ccId", ccId);
 
}

