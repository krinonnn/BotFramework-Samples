/*
 * Botbuilder v4 SDK - Memory Storage
 * 
 * Memory storage is for testing purposes only and is not intended for production use. 
 * Be sure to set storage to a database like AzureTable storage before publishing your bot.
 * 
 * This bot demonstrates how to manage a conversation state and user state with MemoryStorage.
 * 
 * To run this bot:
 * 1) install these npm packages:
 * npm install --save restify
 * npm install --save botbuilder@preview
 * npm install --save botbuilder-azure@preview
 * 
 * 2) From VSCode, open the package.json file and make sure that "main" is not set to any path (or is undefined) 
 * 3) Navigate to your bot app.js file and run the bot in debug mode (eg: click Debug/Start debuging)
 * 4) Load the emulator and point it to: http://localhost:3978/api/messages
 * 5) Send the message "hi" to engage with the bot.
 *
 */ 

const { BotFrameworkAdapter, MemoryStorage, ConversationState, UserState, BotStateSet } = require('botbuilder');
const restify = require('restify');


// Create server
let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log(`${server.name} listening to ${server.url}`);
});

// Create adapter (it's ok for MICROSOFT_APP_ID and MICROSOFT_APP_PASSWORD to be blank for now)  
const adapter = new BotFrameworkAdapter({ 
    appId: process.env.MICROSOFT_APP_ID, 
    appPassword: process.env.MICROSOFT_APP_PASSWORD 
});

// Storage in using MemoryStorage
const storage = new MemoryStorage();
const conversationState = new ConversationState(storage);
const userState  = new UserState(storage);
adapter.use(new BotStateSet(conversationState, userState));

// Listen for incoming requests 
server.post('/api/messages', (req, res) => {
    // Route received request to adapter for processing
    adapter.processActivity(req, res, async (context) => {
        const isMessage = (context.activity.type === 'message');
        const convo = conversationState.get(context);
        const user = userState.get(context);

        if (isMessage) {

             // Defile a topicStates object if it doesn't exist in the convo state.
             if(!convo.topicStates){
                convo.topicStates = { // Define a default state object. Once done, reset back to undefined.
                    "prompt": undefined
                }
            }

            // If user profile is not defined then define it.
            if(!user.userProfile){
                // await context.sendActivity("What is your name?");
                convo.topicStates.prompt = "askName"; // Start the userProfile topic
                user.userProfile = { // Define the user's profile object
                    "userName": undefined,
                    "telephoneNumber": undefined
                }; 
            }

            if(convo.topicStates.prompt == "askName"){
                // Ask for the name.
                await context.sendActivity("What is your name?")
                // Set flag to show we've asked for the name. We save this out so the
                // context object for the next turn of the conversation can check haveAskedNameFlag
                convo.topicStates.prompt = "askNumber";
            } else if(convo.topicStates.prompt == "askNumber"){
                // Save the name.
                user.userProfile.userName = context.activity.text;
                // Ask the user for their number
                await context.sendActivity(`Hello, ${user.userProfile.userName}. What's your telephone number?`);
                // Set flag
                convo.topicStates.prompt = "confirmation";
            } else if(convo.topicStates.prompt == "confirmation"){
                // save the phone number
                user.userProfile.telephoneNumber = context.activity.text;
                convo.topicStates = undefined; // Reset flag
                await context.sendActivity(`Got it. I'll call you later.`);
            }
        }

        // ...
    });
});