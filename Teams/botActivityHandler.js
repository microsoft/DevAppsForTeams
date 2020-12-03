// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const {
    TurnContext,
    MessageFactory,
    TeamsActivityHandler,
    CardFactory,
    ActionTypes
} = require('botbuilder');
const fs = require('fs').promises;
const CustomerService = require('./services/customers');
const { LuisRecognizer, QnAMaker } = require('botbuilder-ai');
const { response } = require('express');
const WELCOMED_USER = 'welcomedUserProperty';

class BotActivityHandler extends TeamsActivityHandler {
    constructor(userState, conversationReferences) {
        super();

        this.channelId = null;
        this.channelIdFilePath = __dirname + '/data/channelId.txt';
        this.loadChannelId();

        const dispatchRecognizer = new LuisRecognizer({
            applicationId: process.env.LuisAppId,
            endpointKey: process.env.LuisAPIKey,
            endpoint: `https://${ process.env.LuisAPIHostName }.cognitiveservices.azure.com`
        }, {
            includeAllIntents: true,
            includeInstanceData: true
        }, true);

        const qnaMaker = new QnAMaker({
            knowledgeBaseId: process.env.QnAKnowledgebaseId,
            endpointKey: process.env.QnAEndpointKey,
            host: process.env.QnAEndpointHostName
        });

        this.dispatchRecognizer = dispatchRecognizer;
        this.qnaMaker = qnaMaker;


        this.welcomedUserProperty = userState.createProperty(WELCOMED_USER);
        this.userState = userState;
        this.conversationReferences = conversationReferences;
        
        this.onConversationUpdate(async (context, next) => {
            this.addConversationReference(context.activity);
            this.userState = userState;
            await next();
        });

        this.onMembersAdded(async (context, next) => {

            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; cnt++) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {

                    await this.sendIntroCard(context);
                }
            }

            await next();
        });

        this.onMessage(async (context, next) => {

            const recognizerResult = await dispatchRecognizer.recognize(context);

            // Top intent will tell us which cognitive service to use
            const intent = LuisRecognizer.topIntent(recognizerResult);

            const didBotWelcomedUser = await this.welcomedUserProperty.get(context, false);
            const userName = context.activity.from.name;      

            await this.dispatchToTopIntentAsync(context, intent, recognizerResult);
            await next();
        });
    }

    async dispatchToTopIntentAsync(context, intent, recognizerResult) {

        const userName = context.activity.from.name;
        const customerService = new CustomerService();
        switch (intent) {
            case 'Greeting':
                await context.sendActivity('Hi, how can I help you today? You can ask me questions like "show me my customers".')
                break;
            case 'Goodbye':
                await context.sendActivity(`Goodbye, take care. Ping me if you need any help.`);
                break;
            case 'Customers':
                const customers = await customerService.getCustomersBySalesPerson(userName);
                let responseText;
                if (customers.length === 0) {
                    responseText = `<b>You don't have any customers.</b>`;
                }
                else {
                    responseText = `<b>Your list of customers</b><br /><br /><table>`;
                    customers.forEach((customer) => {
                        customer.teamsTabLink = this.getDeepLink(customer.id);
                        responseText += `
                        <tr>
                            <td style="font-weight: bold; padding-right: 6pt;">
                                <a href="${customer.teamsTabLink}">${customer.firstName} ${customer.lastName}</a>
                            </td>
                            <td>${customer.address}, ${customer.city} ${customer.state.abbreviation}</td>
                        </tr>`;
                    })
                    responseText += `</table>`;
                }
                await context.sendActivity(responseText);
                break;
            case 'LatestCustomer':
                const customer = await customerService.getLatestCustomer();
                customer.changeType = 'Latest ';
                customer.teamsTabLink = this.getDeepLink(customer.id);
                const customerCard = require('./cards/customerCard');
                const card = customerCard.getCard(customer);
                await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
                break;
            case 'Help':
                await this.sendHelpCard(context);
                break;
            case 'QnA':
                await this.processSampleQnA(context);
                break;
            default:
                console.log(`Dispatch unrecognized intent: ${ intent }.`);
                await context.sendActivity(`Dispatch unrecognized intent: ${ intent }.`);
                break;
        }
    }
   
    async processSampleQnA(context) {
        console.log('processSampleQnA');

        const results = await this.qnaMaker.getAnswers(context);

        if (results.length > 0) {
            await context.sendActivity(`${ results[0].answer }`);
        } else {
            await context.sendActivity('Sorry, could not find an answer in the Q and A system.');
        }
    }

    addConversationReference(activity) {
        const conversationReference = TurnContext.getConversationReference(activity);
        this.conversationReferences[conversationReference.conversation.id] = conversationReference;
    }

    async run(context) {
        await super.run(context);

        // Save state changes
        await this.userState.saveChanges(context);
    }

    async sendIntroCard(context) {
        const card = CardFactory.heroCard(
            'Welcome to the Tailwind Traders Bot!',
            'How can I help you today? You can ask questions like "show me my customers" or choose any of the following:',
            ['https://techcommunity.microsoft.com/t5/image/serverpage/image-id/62311iD9059E979F04D74B?v=1.0'],
            [
                {
                    type: ActionTypes.ImBack,
                    title: 'Get my customers',
                    value: 'get my customers'
                },
                {
                    type: ActionTypes.ImBack,
                    title: 'Latest customer',
                    value: 'latest customer'
                },
                {
                    type: ActionTypes.ImBack,
                    title: 'Say "Hi"',
                    value: 'Hi'
                },
                {
                    type: ActionTypes.OpenUrl,
                    title: 'Learn more about the bot',
                    value: 'https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-howto-deploy-azure?view=azure-bot-service-4.0'
                }
            ]
        );

        await context.sendActivity({ attachments: [card] });
    }
    async sendHelpCard(context) {
        const card = CardFactory.heroCard(
            'Are you lost? I am Tailwind Traders Bot!',
            'I can help you with the questions like "show me my customers" or choose any of the following:',
             [], [
                {
                    type: ActionTypes.ImBack,
                    title: 'Get my customers',
                    value: 'get my customers'
                },
                {
                    type: ActionTypes.ImBack,
                    title: 'Latest customer',
                    value: 'latest customer'
                },
                {
                    type: ActionTypes.ImBack,
                    title: 'Say "Hi"',
                    value: 'Hi'
                },
                {
                    type: ActionTypes.OpenUrl,
                    title: 'Learn more about the bot',
                    value: 'https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-howto-deploy-azure?view=azure-bot-service-4.0'
                }
            ]
        );

        await context.sendActivity({ attachments: [card] });
    }

    async sendSuggestedActions(turnContext) {
        const cardActions = [
            {
                type: ActionTypes.ImBack,
                title: 'Get my customers',
                value: 'get my customers'
            },
            {
                type: ActionTypes.ImBack,
                title: 'Latest customer',
                value: 'latest customer'
            },
            {
                type: ActionTypes.ImBack,
                title: 'Say "Hi"',
                value: 'Hi'
            },
            {
                type: ActionTypes.OpenUrl,
                title: 'Learn more about the bot',
                value: 'https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-howto-deploy-azure?view=azure-bot-service-4.0'
            }
        ];
    
        var reply = MessageFactory.suggestedActions(cardActions, 'Hi There! How can I help you?');
        await turnContext.sendActivity(reply);
    }

    async setChannelId(channelId) {
        this.channelId = channelId;
        // write to file (simplifies cases where demo code is updated live with something like nodemon)
        try {
            await fs.writeFile(this.channelIdFilePath, channelId, 'utf8');
            console.log(`Wrote channelId value of ${channelId} to file`);
        }
        catch (error) {
            return console.log('setChannelId error: ', error);
        }
    }

    async loadChannelId() {
        // retrieve from file (simplifies cases where demo code is updated live with something like nodemon)
        try {
            let channelId = await fs.readFile(this.channelIdFilePath, 'utf8');
            if (channelId) {
                channelId = channelId.trim();
            }
            console.log(`\nRetrieved channelId value of ${channelId} from \n ${this.channelIdFilePath}`);
            this.channelId = channelId;
        }
        catch (error) {
            console.log('getChannelId error: ', error);
            return null;
        }   
    }

    getDeepLink(customerId) {
        const channelId = this.channelId;
        const deepLink = encodeURI(
            `https://teams.microsoft.com/l/entity/${process.env.AppId}/${process.env.EntityId}?label=Vi32&` +
            `context={"subEntityId": "${customerId}", "channelId": "${channelId}" }`
        );
        // console.log('Created deep link: ', deepLink);
        return deepLink
    }

}


module.exports = BotActivityHandler;


            // if (didBotWelcomedUser === false) {
            //     await context.sendActivity(`Hi ${userName}.`);
            //     await this.welcomedUserProperty.set(context, true);
            // }

        //     const text = context.activity.text.toLowerCase();
        //     console.log('Message received: ', text);
        //     const customerService = new CustomerService();
        //     switch (text) {
        //         case 'hello':
        //         case 'hi':
        //             await context.sendActivity(`Hi ${userName}. You don't have any new notifications.`);
        //             break;
        //         case 'latest customer':
        //         case 'customer':
        //             const customer = await customerService.getLatestCustomer();
        //             customer.changeType = 'Latest ';
        //             const customerCard = require('./cards/customerCard');
        //             const card = customerCard.getCard(customer);
        //             await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
        //             break;
        //         case 'get my customers':
        //             const customers = await customerService.getCustomersBySalesPerson(userName);
        //             let responseText = `I found ${customers.length} customers for ${userName}:<br /><ul>`;
        //             customers.forEach((customer) => {
        //                 responseText += `<li>${customer.firstName} ${customer.lastName} ${customer.address}, ${customer.city} ${customer.state.abbreviation}</li>`;
        //             })
        //             responseText += `</ul>`;
        //             await context.sendActivity(responseText);
        //             break;
        //         case 'intro':
        //         case 'help':
        //             await this.sendIntroCard(context);
        //             break;
        //         default:
        //             await context.sendActivity(`You said "${context.activity.text}"`);
        //     }

