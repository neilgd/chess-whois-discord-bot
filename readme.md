This adds /whois and /who-link commands to Discord, and also a user context who is command.

Pulls back information from Lichess, chess.com, Chess Dojo and Lichess Ladders.

The Discord bot can be installed per-user or on servers here:

https://discord.com/oauth2/authorize?client_id=1382031526107025489&scope=bot%20applications.commands&permissions=0&integration_type=0&integration_type=1

If you want to host it yourself, you'll need to:

1) set up an AWS lambda function.  The function entry point is discord-handler.handler
2) set up a Discord bot
3) Set up a function URL for the lambda function
5) Set the following environment variables:

* DISCORD_TOKEN
* DISCORD_APP_ID
* DISCORD_PUBLIC_KEY
* DISCORD_SERVER_ID - Server for testing purposes
* DYNAMO_TABLE - A Dynamo DB table for storing /whois-lookup data

6) Set up a DynamoDB table with discordId (key), lichessId, ccId and updatedAt fields

To deploy the command:

1) Run deploy-commands.ps1 - this will update the commands available to the bot
2) Edit deploy-discord-handler.ps1 to include the lambda function name
3) Run deploy-discord-handler.ps1 to deploy the code as an AWS lambda function

4) Add the lambda function name as the interactions web hook for the bot.
And here is the install URL for both user and server installs:

https://discord.com/oauth2/authorize?client_id=DISCORD_APP_ID&scope=bot%20applications.commands&permissions=0&integration_type=0&integration_type=1

To use the /whois-link option, your lambda function will need access to the chess-who-is-lookup table in DynamoDB, or set your own and set the DYNAMO_TABLE environment variable



