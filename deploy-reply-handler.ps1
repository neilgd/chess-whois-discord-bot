npm run build-reply
Compress-Archive -Path dist\reply-handler.js -DestinationPath function.zip -Force
aws lambda update-function-code --function-name chess-whois-discord-bot-reply --zip-file fileb://function.zip --publish --no-cli-pager --output table
