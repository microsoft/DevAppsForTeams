# Developing Apps for Teams

This sample application demonstrates how to integrate a Web application into Teams. It supports the following features:

- [Azure Active Directory](https://docs.microsoft.com/en-us/azure/active-directory/) and [Microsoft Authentication Library](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-overview) (MSAL) when the app runs outside of Teams
- [Single Single-On](https://docs.microsoft.com/en-us/microsoftteams/platform/tabs/how-to/authentication/auth-aad-sso) when the app runs inside of Teams
- Use of the [Teams JavaScript client SDK](https://docs.microsoft.com/en-us/javascript/api/overview/msteams-client?view=msteams-client-js-latest)
- Teams app [custom tab](https://docs.microsoft.com/en-us/microsoftteams/platform/tabs/what-are-tabs)
- [Bots](https://docs.microsoft.com/en-us/microsoftteams/platform/bots/what-are-bots) that leverage [LUIS and QnA Maker Azure Cognitive Services](https://docs.microsoft.com/en-us/azure/cognitive-services/what-are-cognitive-services#language-apis)
- App to bot communication

**NOTE:** This application is a work in progress that will continue to be enhanced and updated over time.

## Prerequisites

- [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli)
- [PowerShell](https://docs.microsoft.com/powershell/scripting/install/installing-powershell?view=powershell-7.1)
- [Microsoft 365 tenant](https://developer.microsoft.com/microsoft-365/dev-program)
- [Node.js LTS](https://nodejs.org/)

## Setup

The following instructions will help you get the project running locally on your computer. If you want to deploy it to Azure, you will need to adjust the URL of where the web app is hosted to match the URL of your web app in Azure.

### Set up SSL and a host name

Start by creating a self-signed SSL certificate and custom host name that will resolve to your computer. 

**NOTE:** Although ngrok provides a way to run a local server using SSL and access it externally, we won't be using it here since 2 tunnels are needed for this app (one for the app itself and one for the bot). As a result you would need a paid version of [ngrok](https://ngrok.com). While we won't be using ngrok here to run the app (due to the paid requirement), if you do have a paid version of ngrok you can skip this section and use the URL of your ngrok tunnels instead.

#### Create certificate authority and a certificate

1. Open terminal
1. Create a certificate authority by executing:

    ```sh
    npx mkcert create-ca --organization "MyOrg" --validity 825
    ```

1. Create a certificate by executing:

    ```sh
    npx mkcert create-cert --ca-key "ca.key" --ca-cert "ca.crt" --validity 825 --domains "devappsforteams.local"
    ```

    As the domain name, you can specify any valid fully-qualified domain name (FQDN) you want. In the next step, you will configure your computer to resolve this FQDN to your local machine.

1. Follow the steps in [this article](https://bob1german.com/2020/10/17/setting-up-ssl-for-tabs-in-the-teams-toolkit-for-visual-studio-code/) to add the generated certificate authority to your cert store.

#### Configure host name

1. In a code editor start as administrator, open your `hosts` file based on your target operating system:

    **Windows:** `c:\windows\system32\drivers\etc\hosts`

    **Mac:** `/etc/hosts`
    
    Append your FQDN as shown next: `127.0.0.1    devappsforteams.local`
    
    **IMPORTANT:** Make sure that you replace `devappsforteams.local` with the FQDN you chose in the previous steps.

1. Save your changes

#### Configure certificate and host name with the web app

1. In the `CustomerOrdersApp` folder, create a new folder named `.cert`
1. Copy the generated `cert.crt` and `cert.key` files to `CustomerOrdersApp/.cert`
1. In the code editor, open the `CustomerOrdersApp/server.js` file and on line 16, update the value of the `domain` const to match your FQDN.

### Deploy Azure AD configuration

1. In the code editor, open the `setup/setup.ps1` file
1. Change the value of the `$domain` variable to the FQDN you chose previously followed by `:8443`, eg. `devappsforteams.local:8443`
1. Start PowerShell
1. Change the working directory to `setup` (a folder located in this repository)
1. Login to Azure:

    ```powershell
    az login --tenant <REPLACE_WITH_TENANT_NAME_OR_ID> --allow-no-subscriptions
    ```

1. Execute the setup script:

    ```powershell
    ./setup.ps1
    ```

    **Tip:**
    If the setup script fails with an `Request_ResourceNotFound` error, execute the script again. Sometimes creating the Azure AD app takes longer than expected and when the script continues, the app isn't fully provisioned yet. Running the script again will update the previously created app with the missing values.

1. Take note of the `AppId`, `AppPassword` and `AppUri` output by the setup script. Make sure that you save these values before continuing.

### Configure the web app

1. In the code editor open the `CustomerOrdersApp/.env sample` file
1. Change the value of the `AppId` and `AppPassword` properties to match the values returned by the setup script in the previous step
1. Save the file as `CustomerOrdersApp/.env`
1. Locate the `CustomerOrdersApp/src/environments/environment-sample.ts` and perform the following steps:

    - Make a copy of the file and paste it in the same `environments` folder. 
    - Rename the newly copied file to `environment.ts`.

1. Open `environment.ts` and perform the following steps:

    - Change the `clientId` property value to the `AppId` value that you saved in the previous section when setting up Azure Active Directory.
    - Change the `botApiUrl` property value to the FQDN you setup earlier in the `Configure certificate and host name with the web app` section. For example, if you used `devappsforteams.local` then the `botApiUrl` value would need to be `https://devappsforteams.local:3978`. Ensure that you add port `:3978` at the end of the URL.

### Start the web app

1. Open terminal
1. Change the working directory to `CustomerOrdersApp`
1. Restore project dependencies by executing:

    ```sh
    npm install
    ```

1. Build the web app by executing:

    ```sh
    npm run build
    ```

1. Start the web app by executing:

    ```sh
    npm start
    ```

1. Verify that you can open the web app, by navigating in the browser to `https://devappsforteams.local:8443`, where the domain name is the FQDN you chose previously

### Setup bot

TBD: We need to setup the bot here because we need to include its ID in the manifest in the next step

### Update Teams app manifest

1. Make a copy of the `Teams/manifest sample.json` file and name it `manifest.json`. Ensure that you add `manifest.json` to the `Teams` folder.
1. Open `manifest.json` in a code editor.
1. In the `developer` property, change the value of the `websiteUrl`, `privacyUrl` and `termsOfUseUrl` properties to match the URL of your web app, eg. `https://devappsforteams.local:8443`
1. In the `configurableTabs` property, update the value of the `configurationUrl` property to match your ngrok tunnel followed by `config`, eg. `https://devappsforteams.local:8443/config`
1. In the `staticTabs` property, update the value of the `contentUrl` and `websiteUrl` properties to match the URL of your ngrok tunnel followed by `tab`, eg. `https://devappsforteams.local:8443/tab`
1. In the `bots` property, update the value of the `botId` property to the ID of the bot you configured in the previous step, eg. `ee3cda2a-4e28-495b-bc89-54f3a1a9f66e`
1. In the `validDomains` array, include your FQDN without the port number, eg. `devappsforteams.local`
1. In the `webApplicationInfo` property, update the value of the `id` property to the `AppId` value returned by the setup script
1. In the `webApplicationInfo` property, update the value of the `resource` property to the `AppUri` value returned by the setup script

### Create Teams app package

1. Open terminal
1. Change the working directory to `Teams`
1. Restore project dependencies by executing:

    ```sh
    npm install
    ```

1. Create Teams app package by executing:

    ```sh
    npm run build:zip
    ```

### Deploy app to Teams

1. In the web browser navigate to `https://teams.microsoft.com` and sign in with your dev account
1. From the left rail, select **Apps**
1. From the menu, select **Upload a custom app** and in the submenu choose `Upload for <your-organization>`
1. In the file dialog, select the generated `Teams/package/TailwindTraders.zip` file
1. In the list of apps, select the newly added app and in the app's dialog, choose **Add**
1. After the app launched, from the tab-header bar choose **Customer App**. You should see the web app launched inside Teams

TBD: add steps for trying out the bot

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft 
trademarks or logos is subject to and must follow 
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
