npm run build
Compress-Archive -Path dist\discord-handler.js -DestinationPath function.zip -Force
aws lambda update-function-code --function-name chess-whois-discord-bot --zip-file fileb://function.zip --publish --no-cli-pager --output table
