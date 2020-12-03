const salesPeople = require('../data/sales-people.json');

module.exports = async function (context, req) {
    context.res = {
        headers: {
          'Content-Type': 'application/json'    
        },
        // status: 200, /* Defaults to 200 */
        body: salesPeople
    };
}