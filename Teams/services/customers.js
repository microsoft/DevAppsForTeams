const fetch = require('node-fetch');

class CustomerService {

    async getCustomer(id) {
        const customer = await this.getJson(`/api/customers/${id}`);
        if (customer) {
            // Get customer's sales person
            const customerWithSalesPerson = await this.getCustomerSalesPerson(customer);
            return customerWithSalesPerson;
        }
        return null;
    }

    async getLatestCustomer() {
        const customer = await this.getJson('/api/latestCustomer');
        if (customer) {
            // Get customer's sales person
            const customerWithSalesPerson = await this.getCustomerSalesPerson(customer);
            return customerWithSalesPerson;
        }
        return null;
    }

    async getCustomerSalesPerson(customer) {
        const salesPeople = await this.getJson('/api/salespeople');
        if (customer && salesPeople && salesPeople.length) {
            const salesPerson = salesPeople.find(salesPerson => salesPerson.id === customer.salesPersonId);
            customer.salesPerson = (salesPerson) ? salesPerson.firstName + ' ' + salesPerson.lastName : '';
        }
        return customer;
    }

    async getCustomersBySalesPerson(salesPersonName) {
        let result = [];
        if (salesPersonName) {
            // If salesPersonName == Burke Holland
            // Example: https://learntogethercrm.ngrok.io/api/customersBySalesPerson/Burke%20Holland
            const url = `/api/customersBySalesPerson/${encodeURI(salesPersonName)}`;
            const customers = await this.getJson(url);
            if (customers) {
                for (let cust of customers) {
                    cust.salesPerson = salesPersonName;
                }
                result = customers;
            }
        }
        return result;
    }

    async getJson(apiUrl) {
        try {
            // Checking port since if ngrok is used and port is 80 we don't want to add it (will break)
            const port = (process.env.CrmPort === '80') ? '' : `:${process.env.CrmPort}`;
            const url = `${process.env.CrmUrl}${port}${apiUrl}`;
            const response = await fetch(url, {
                method: "GET",
                headers: { Accept: "application/json" }
            });

            console.log(`Received ${apiUrl} data with status code ${response.status}`);

            if (response.status !== 200) {
                throw `Response error ${response.status}: ${response.statusText}`;
            }

            const result = await response.json();
            return result;
        }
        catch (error) {
            console.log(error);
        }

        return null;
    }
}

module.exports = CustomerService;