const fs = require('fs');
const ACData = require('adaptivecards-templating'); 
const AdaptiveCards = require('adaptivecards'); 

// Function returns an adaptive card for a customer
exports.getCard = function (customer) {

    const card = JSON.parse(fs.readFileSync('./cards/customer-card.json', 'utf-8'));

    // Create a Template instance from the template
    const template = new ACData.Template(card);

    // Pass the CRM URL for image rendering
    // Since we're using a local HOSTS entry the adaptive card proxy won't be able to reach this URL
    // Would work if using ngrok to reach the local CRM server
    // customer.crmUrl = `${process.env.CrmUrl}:${process.env.CrmPort}`;

    // Going with this Azure SWA app since it's reachable for the adaptive card proxy
    customer.crmUrl = 'https://jolly-sand-0e24e951e.azurestaticapps.net';

    console.log(customer.crmUrl);
    
    // Expand the template with your `$root` data object.
    // This binds it to the data and produces the final Adaptive Card payload
    const ManagerCardLoad = template.expand({ $root: customer });
    const adaptiveCard = new AdaptiveCards.AdaptiveCard();
    adaptiveCard.parse(ManagerCardLoad);
    
    return adaptiveCard;
}