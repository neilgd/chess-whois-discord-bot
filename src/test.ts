import { userDescriptionFromDiscordUserId } from "./user-description";

test();

async function test()
{
    console.log(await userDescriptionFromDiscordUserId('1229698220293230654'));
    console.log(await userDescriptionFromDiscordUserId('1335284045168250953'));
    console.log(await userDescriptionFromDiscordUserId('1119213345405411358'));    
}
