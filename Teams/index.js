// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const { CardFactory, TeamsInfo } = require('botbuilder'),

    // Import required pckages
    path = require('path'),
    express = require('express');
    bodyParser  = require('body-parser'),

    // Import required bot services.
    // See https://aka.ms/bot-services to learn more about the different parts of a bot.
    //const { BotFrameworkAdapter } = require('botbuilder');
    { BotFrameworkAdapter, UserState, MemoryStorage } = require('botbuilder');

// index.js is used to setup and configure your bot
const memoryStorage = new MemoryStorage();
const userState = new UserState(memoryStorage);
const conversationReferences = {};
// Create the main dialog.


// Import bot definitions
const BotActivityHandler = require('./botActivityHandler');
const { userInfo } = require('os');
const CustomerService = require('./services/customers');

// Read botFilePath and botFileSecret from .env file.
const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters.
const adapter = new BotFrameworkAdapter({
    appId: process.env.BotId,
    appPassword: process.env.BotPassword
});

console.log('BotId', process.env.BotId);

adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};

// Create bot handlers
const botActivityHandler = new BotActivityHandler(userState,conversationReferences);

// Create HTTP server.
const server = express();

server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());

//CORS
server.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, Authorization, X-Requested-With, X-XSRF-TOKEN, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    next();
});

const port = process.env.port || process.env.PORT || 3978;
server.listen(port, () => 
    console.log(`\Bot/ME service listening at http://localhost:${port}`)
);

// Listen for incoming requests.
server.post('/api/messages', (req, res) => {
    console.log('/api/messages called');
    adapter.processActivity(req, res, async (context) => {
        // Process bot activity
        await botActivityHandler.run(context);
    });
});

//Reference: https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-howto-proactive-message?view=azure-bot-service-4.0&tabs=javascript
// Used by Customer/Orders App to send update/delete/insert update notifications
server.post('/api/notify', async (req, res) => {
    if (conversationReferences && Object.keys(conversationReferences).length === 0) {
        console.log('\n********************\nNo bot conversationReferences! Reinstall Teams app.\n*******************');
    }
    
    for (const conversationReference of Object.values(conversationReferences)) {
        await adapter.continueConversation(conversationReference, async (context) => {
            
            // If you encounter permission-related errors when sending this message, see
            // https://aka.ms/BotTrustServiceUrl

            // // https://teams.microsoft.com/l/entity/<appId>/index?label=Vi32&context=<context>

            // Build a deep link to the current user tab and customer
           
            const userName = await TeamsInfo.getMembers(context,encodeURI(userInfo.id));
            console.log('Sending customer card for /api/notify');
            let customer = req.body.customer;

            if (customer) {
                customer.changeType = getChangeType(req.body.changeType);  
                console.log("Change type: ", req.body.changeType);

                // Add deep link for Insert/Update changes so user can click to see customer
                if (req.body.changeType !== 'Delete') {
                    customer.teamsTabLink = botActivityHandler.getDeepLink(customer.id);
                    console.log('Deep linking Url: ', customer.teamsTabLink);
                }

                const customerService = new CustomerService();
                customer = await customerService.getCustomerSalesPerson(customer);              
                const customerCard = require('./cards/customerCard');
                const card = customerCard.getCard(customer);
                await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });          
            } 

        });
    }

    res.json(req.body);
});

// Handle getting channelId sent from LOB app
server.post('/api/channelId', async (req, res) => {
    const channelId = req.body.channelId;
    console.log('Received channelId: ', channelId);
    botActivityHandler.setChannelId(channelId);
    res.json({ channelId });
});

function getChangeType(changeType) {
    switch (changeType) {
        case 'Insert':
            return 'New ';
        case 'Update':
            return 'Updated ';
        case 'Delete':
            return 'Deleted ';
        default:
            return '';
    }
}