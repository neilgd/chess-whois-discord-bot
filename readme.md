This adds /whois and /who-link commands to Discord, and also a user context who is command.

Pulls back information from Lichess, chess.com, Chess Dojo and Lichess Ladders.

The Discord bot can be installed per-user or on servers here:

https://discord.com/oauth2/authorize?client_id=1440786715366133900

#Structure
There are two lambda functions. The first lambda function (chess-whois-discord-bot) verifies the data from Discord and acknowledges the request, deferring the response. It also calls the second lambda function (hess-whois-discord-bot-reply) which does the actual work.

This is because cold starts etc. can take longer than 3 seconds for the main work, so it needs to be done separately

If you want to host it yourself, you'll need to:

1) set up an AWS lambda function.  The function entry point is discord-handler.handler. Make sure it has 512Mb memory to avoid slow cold starts.
2) set up a second AWS lamda function. The function entry point is reply-handler.handler
3) make sure the first lambda function has permissions to call the second
4) set up a Discord bot
5) Set up a function URL for the first lambda function
6) Set the following environment variables:

* DISCORD_TOKEN
* DISCORD_APP_ID
* DISCORD_PUBLIC_KEY
* DISCORD_SERVER_ID - Server for testing purposes
* DYNAMO_TABLE - A Dynamo DB table for storing /whois-lookup data

6) Set up a DynamoDB table with discordId (key), lichessId, ccId and updatedAt fields

To deploy the command:

1) Run deploy-commands.ps1 - this will update the commands available to the bot
2) Edit deploy-discord-handler.ps1 to include the lambda function name
3) Run deploy-discord-handler.ps1 to deploy the code as the first AWS lambda function
4) Run deploy-reply-handler.ps1 to deploy the code as the second AWS lambda function

4) Add the lambda function name as the interactions web hook for the bot.

To use the /whois-link option, your lambda function will need access to the chess-who-is-lookup table in DynamoDB, or set your own and set the DYNAMO_TABLE environment variable



