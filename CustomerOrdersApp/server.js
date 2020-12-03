"use strict";
const   express     = require('express'),
        exphbs      = require('express-handlebars'),
        https       = require('https'),
        bodyParser  = require('body-parser'),
        fs          = require('fs'), 
        fetch       = require("node-fetch"),
        querystring = require("querystring"),
        app         = express(), 
        customers   = JSON.parse(fs.readFileSync('data/customers.json', 'utf-8')),
        states      = JSON.parse(fs.readFileSync('data/states.json', 'utf-8')),
        salesPeople = JSON.parse(fs.readFileSync('data/sales-people.json', 'utf-8')),
        inContainer = process.env.CONTAINER,
        inAzure = process.env.WEBSITE_RESOURCE_GROUP,
        port = process.env.PORT || 8080;

const hbs = exphbs.create({
    extname: '.hbs'
});
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//CORS
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, Authorization, X-Requested-With, X-XSRF-TOKEN, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    next();
});

const ENV_FILE =__dirname + '/.env';
require('dotenv').config({ path: ENV_FILE });

//The dist folder has our static resources (index.html, css, images)
if (!inContainer) {
    app.use(express.static(__dirname + '/dist')); 
    console.log(__dirname);
}

// Pop-up dialog to ask for additional permissions, redirects to AAD page
app.get('/authstart', (req, res) => {
    var clientId = process.env.AppId;
    res.render('auth-start', { clientId: clientId });
});

// End of the pop-up dialog auth flow, returns the results back to parent window
app.get('/authend', (req, res) => {
    var clientId = process.env.AppId;
    res.render('auth-end', { clientId: clientId });
}); 

app.get('/api/customers/page/:skip/:top', (req, res) => {
    const topVal = req.params.top,
          skipVal = req.params.skip,
          skip = (isNaN(skipVal)) ? 0 : +skipVal;  
    let top = (isNaN(topVal)) ? 10 : skip + (+topVal);

    if (top > customers.length) {
        top = skip + (customers.length - skip);
    }

    console.log(`Skip: ${skip} Top: ${top}`);

    var pagedCustomers = customers.slice(skip, top);
    res.setHeader('X-InlineCount', customers.length);
    res.json(pagedCustomers);
});

app.get('/api/customers', (req, res) => {
    res.json(customers);
});

app.get('/api/customers/:id', (req, res) => {
    const customerId = +req.params.id;
    let selectedCustomer = null;
    for (let customer of customers) {
        if (customer.id === customerId) {
           // found customer to create one to send
           selectedCustomer = {};
           selectedCustomer = customer;
           break;
        }
    }  
    res.json(selectedCustomer);
});

app.post('/api/customers', (req, res) => {
    const postedCustomer = req.body;
    let maxId = Math.max.apply(Math,customers.map((cust) => cust.id));
    postedCustomer.id = ++maxId;
    postedCustomer.gender = (postedCustomer.id % 2 === 0) ? 'female' : 'male';
    customers.push(postedCustomer);
    res.json(postedCustomer);
});

app.put('/api/customers/:id', (req, res) => {
    const putCustomer = req.body;
    const id = +req.params.id;
    let status = false;

    //Ensure state name is in sync with state abbreviation 
    const filteredStates = states.filter((state) => state.abbreviation === putCustomer.state.abbreviation);
    if (filteredStates && filteredStates.length) {
        putCustomer.state.name = filteredStates[0].name;
        console.log('Updated putCustomer state to ' + putCustomer.state.name);
    }

    for (let i=0,len=customers.length;i<len;i++) {
        if (customers[i].id === id) {
            customers[i] = putCustomer;
            status = true;
            break;
        }
    }
    res.json({ status: status });
});

app.delete('/api/customers/:id', function(req, res) {
    const customerId = +req.params.id;
    for (let i=0,len=customers.length;i<len;i++) {
        if (customers[i].id === customerId) {
           customers.splice(i,1);
           break;
        }
    }  
    res.json({ status: true });
});

app.get('/api/orders/:id', function(req, res) {
    const customerId = +req.params.id;
    for (let cust of customers) {
        if (cust.customerId === customerId) {
            return res.json(cust);
        }
    }
    res.json([]);
});

app.get('/api/states', (req, res) => {
    res.json(states);
});

app.get('/api/salesPeople', (req, res) => {
    res.json(salesPeople);
});

app.get('/api/latestCustomer', (req, res) => {
    const latestCustomer = customers.reduce((a, b) => {
        if (a.joinDate && b.joinDate) {
            return new Date(a.joinDate) > new Date(b.joinDate) ? a : b;
        }
        else if (!a.joinDate) {
            return b;
        }
        else if (!b.joinDate) {
            return a;
        }
    });
    res.json(latestCustomer);
});

app.get('/api/customersBySalesPerson/:name', (req, res) => {
    const name = req.params.name;
    if (name) {
        const splitName = name.split(' ');
            if (splitName && splitName.length === 2) {
            const salesPerson = salesPeople.find(sp => {
                return sp.firstName.toLowerCase() === splitName[0].toLowerCase() && 
                       sp.lastName.toLowerCase() === splitName[1].toLowerCase()
            });
            if (salesPerson) {
                const selectedCustomers = customers.filter(c => c.salesPersonId === salesPerson.id);
                return res.json(selectedCustomers);
            }
        }
    }
    return res.json(null);
});

// On-behalf-of token exchange
app.post('/api/auth/token', function(req, res) {
    var tid = req.body.tid;
    var token = req.body.token;
    var scopes = ["https://graph.microsoft.com/User.Read"];

    var oboPromise = new Promise((resolve, reject) => {
        const url = "https://login.microsoftonline.com/" + tid + "/oauth2/v2.0/token";
        const params = {
            client_id: process.env.AppId,
            client_secret: process.env.AppPassword,
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: token,
            requested_token_use: "on_behalf_of",
            scope: scopes.join(" ")
        };
    
        fetch(url, {
                method: "POST",
                body: querystring.stringify(params),
                headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }).then(result => {
            if (result.status !== 200) {
                result.json().then(json => {
                    // TODO: Check explicitly for invalid_grant or interaction_required
                    reject({"error":json.error});
                });
            } else {
                result.json().then(json => {
                    resolve(json.access_token);
                });
            }
        });
    });

    oboPromise.then(function(result) {
        res.json(result);
    }, function(err) {
        console.log(err); // Error: "It broke"
        res.json(err);
    });
});

if (!inContainer) {
    // redirect all others to the index (HTML5 history)
    app.all('/*', function(req, res) {
        res.sendFile(__dirname + '/dist/index.html');
    });
}

// HTTP
app.listen(port);

// HTTPS
// var privateKey  = fs.readFileSync('.cert/cert.key', 'utf8');
// var certificate = fs.readFileSync('.cert/cert.crt', 'utf8');
// var credentials = {key: privateKey, cert: certificate};
// var httpsServer = https.createServer(credentials, app);
// httpsServer.listen(port);

console.log('Express listening on port ' + port);

//Open browser
// if (!inContainer && !inAzure) {
//     var opn = require('opn');

//     opn('http://localhost:' + port).then(() => {
//         console.log('Browser closed.');
//     });
// }

