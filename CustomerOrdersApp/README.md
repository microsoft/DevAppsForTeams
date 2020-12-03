# Tailwind Traders M365


## Running the Application

Clone the project or download and extract the .zip to get started. 

1. Copy `.env sample` to a file named `.env`. Update the file with the Azure Active Directory AppId and password/secret you created.

1. Install the latest LTS version of [Node.js](https://nodejs.org). 

    *IMPORTANT: The server uses ES2015 features so you need a current version of Node.js.*

1. Open a terminal window and run the following commands to install dependencies, build the code, and start the server:

    ```
    npm install
    npm run build
    npm start
    ```

1. Run `ngrok http -subdomain=<your-subdomain> 8080` to launch ngrok (assumes ngrok basic or higher with custom subdomain support).

1. Go to http://<your-subdomain>.ngrok.io:8080 in your browser.

## Modifying the Code

1. If you'd like to modify the code you'll need the build process to rebuild the code after any changes that you make. To do that you can run:

    ```
    npm install
    npm run build:watch
    ```

1. Open another command window and run:

    ```
    npm start
    ```

1. Run `ngrok http -subdomain=<your-subdomain> 8080` to launch ngrok (assumes ngrok basic or higher with custom subdomain support).

1. Go to http://<your-subdomain>.ngrok.io:8080 in your browser.

Note: The `npm run build:watch` command will rebuild your code when a file changes but you'll need to refresh your browser to see the changes.

