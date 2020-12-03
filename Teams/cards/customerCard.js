const fs = require('fs');
const ACData = require('adaptivecards-templating'); 
const AdaptiveCards = require('adaptivecards'); 

// Function returns an adaptive card for a customer
exports.getCard = function (customer) {

    const card = JSON.parse(fs.readFileSync('./cards/customer-card.json', 'utf-8'));

    // Create a Template instance from the template
    const template = new ACData.Template(card);

    // Expand the template with your `$root` data object.
    // This binds it to the data and produces the final Adaptive Card payload
    const ManagerCardLoad = template.expand({ $root: customer });
    const adaptiveCard = new AdaptiveCards.AdaptiveCard();
    adaptiveCard.parse(ManagerCardLoad);
    
    return adaptiveCard;
}