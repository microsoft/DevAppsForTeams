# Tailwind Traders Bot Setup and Configuration

*Bots* allow users to interact with your web service through text, interactive cards, and task modules. *Messaging extensions* allow users to interact with your web service through buttons and forms in the Microsoft Teams client. They can search, or initiate actions, in an external system from the compose message area, the command box, or directly from a message.

## Prerequisites
-  [NodeJS](https://nodejs.org/en/)
-  [ngrok](https://ngrok.com/) or equivalent tunneling solution
-  [M365 developer account](https://docs.microsoft.com/microsoftteams/platform/concepts/build-and-test/prepare-your-o365-tenant?WT.mc_id=m365-10863-aycabas) or access to a Teams account with the appropriate permissions to install an app
- [Microsoft Azure](https://portal.azure.com/) subscription

## Setup

### 1. Configure Cognitive Services

Rename `.env sample` file as `.env`.

#### Import LUIS model (Language Understanding Intelligent Service)
1. Go to [LUIS Portal](https://www.luis.ai/) and select `Login / Sign up`. Sign in with your account that has Microsoft Azure subscription.
2. Select the arrow on the right side of the `New app` button and choose `Import as JSON` to [import](https://cda.ms/1RB) `'TailwindLuis.json'` file available under **services > CognitiveServices** folder.
3. Train your LUIS model by choosing `Train` on the top right. 
4. Test your LUIS model by choosing `Test` and try using the following uttarances as an example, "Hi", "Can you help?" and "Get me my customer list" to see the intent results.
5. Publish your LUIS model by selecting `Publish`. Select `Production slot` and `Done`.

6. Go to **Manage** on the top right and then **Azure resources** tab. Select `Add prediction resource` and choose `Create a new prediction resource` link on the bottom. Fill the fields as the following and click `Done`:
    * **Azure subscription:** Choose your Azure subscription
    * **Azure resource group:** Choose a resource group
    * **Location:** Choose preferred location
    * **Price Tier:** Choose preferred price tier

7. Copy `Endpoint URL` and `Primary Key` from **Prediction Resources** under the **Azure Resources**. Also, copy `App ID` from **Application Settings** under the **Settings** tab. Add the following fields in `.env` file:

    ```
    LuisAppId= <App-ID>
    LuisAPIKey= <Primary-Key>
    LuisAPIHostName= <Fully qualified hostname from endpoint URL>
    ```

#### Create QnA knowledge base
1. Go to [QnA Maker Portal](https://www.qnamaker.ai/) and select `Sign in` from top right. Sign in with your  account that has Azure subscription.
2. Click on `Create a knowledge base` on the top and complete the steps as follows:
    * **STEP 1**: Select `Create a QnA Service`, you will be directed to [Azure Portal](https://portal.azure.com) and login with the same account. Fill the fields as follows and select `Review + create`, then `Create`:
      * **Subscription:** Choose your Azure Subscription
      * **Resource group:** Choose a resource group or create new
      * **Name:** Give a name to your QnA service
      * **Price tier:** Choose pricing tier as *Standard*
      * **Azure Search location:** Choose preferred location
      * **Azure Search pricing tier:** Choose pricing tier as *Standard*
      * **App name:** Gıve a name to your app
      * **Website location:** Choose preffered location
      * **App insights:** Enable
      * **App insights location:** Choose preferred location
    
      Once your QnA service is created, return to [QnA Maker Portal](https://www.qnamaker.ai/) and continue with the steps.

    * **STEP 2:** Select `Refresh` and choose the fields as following:
      * **Microsoft Azure Directory ID:** Choose your tenant
      * **Azure subscription name:** Choose your Azure subscription
      * **Azure QnA service:** Choose your QnA service you recently created
      * **Language:** English

    * **STEP 3:** Give a name to your knowledge base
    * **STEP 4:** Populate your knowledge base by selecting `+ Add file` link and choose `TailwindQnAMaker.csv` file available under the `services > CognitiveServices` folder. Keep **Chit-chat** as `None`.
    * **Step 5:** Select `Create your KB`.

  
3. Select `Save and train` from the top right. 
4. Click on `Test` and test your knowledge base by asking questions as the following examples: "How old are you?", "Do you breathe?", "Can you dream?".
5. Go to **PUBLISH** and select `Publish` to publish your knowledge base.
6. Under the **Postman** title, copy your `KnowledgeBase-ID` from /knowledgebases/`xxxx-xxxxx-xxxx`/generateAnswer, also copy `Host` and `Authorization: EndpointKey`. Add the following fields in `.env` file:

    ```
    QnAKnowledgebaseId= <KnowledgeBase-ID>
    QnAEndpointKey= <Authorization: EndpointKey>
    QnAEndpointUrl= <Endpoint URL>
    ```
 
### 2. Configure Ngrok

Your app will run from a localhost server. You will need to setup Ngrok in order to tunnel from the Teams client to localhost. 
#### Install Ngrok
Go to [Ngrok website](https://www.ngrok.com) and install ngrok.

#### Run Ngrok
1. Unzip and open ngrok, then run the following script:

    `ngrok http -host-header=rewrite 3978`

2. Copy your `https://{subdomain}.ngrok.io`, you will need it in the next step.

### 3. Create Azure Bot Channels Registration

1. Go to [Azure Portal](https://portal.azure.com) and select `+ Create a resource`. Search for `Bot Channels Registration` and choose `Create`. Fill the fields as follows and select `Create`:
    * **Bot handle:** Give a unique name to your bot
    * **Subscription:** Choose your subscription
    * **Resource group:** Choose a resource group or create new
    * **Location:** Choose preferred location
    * **Pricing tier:** Choose preferred pricing tier
    * **Messaging endpoint:** For the Messaging endpoint URL, use the current `https` URL you were given by running ngrok and append it with the path `/api/messages`. It should like something work `https://{subdomain}.ngrok.io/api/messages`.
    * **Application Insights:** On
    * **Application Insights Location:** Choose preferred location
    * **Microsoft App ID and password:** Auto create App ID and password

2. Go to your **Bot Channels Registration** resource and select `Channel` from left-hand side menu. Choose `Microsoft Teams` icon to enable Teams as a channel and `Save`.
3. Go to **Settings** from left-hand side menu and find `Microsoft App ID` and click on `Manage` link on the right. You will be directed to **Certificates & secrets**. 
4. In **Certificates & secrets**, select `+ New client secret` and `Add`. Copy your `Client Secret Value`.
5. Go to **Overview**, and copy `Application (Client) ID`. 
6. Add the following fields in `.env` file:

    ```
    BotId= <Application-(Client)-ID>
    BotPassword= <Client-Secret-Value>
    ```

### 4. Build and run

Open your terminal in Visual Studio Code (`Ctrl+ Shift + '`) and type the following scripts in sequence:

1. Go to your Teams bot project folder:
    #### `cd Teams`

2. Install npm:
    #### `npm install`

3. Start your project:
    #### `npm start`

Now, your project is running on https://localhost:3978 which you've been tunneling with ngrok.

### 5. Test your project on Microsoft Teams

1. Go to [Microsoft Teams](https://teams.microsoft.com) and login with your [M365 developer account](https://docs.microsoft.com/microsoftteams/platform/concepts/build-and-test/prepare-your-o365-tenant?WT.mc_id=m365-10863-aycabas).

2. Select `...` button on the left hand side menu and search for `App Studio.` Install and open App Studio.

3. Go to `Manifest Editor` and choose `+ Create a new app` on the left hand side menu.

4. Fill the `App details` fields as following:
   * **Short name:** Give your app a short name
   * **Full name:** Give your app a full name
   * **App ID:** Click on `Generate` and your App ID will be generated 
   * **Package Name:** com.microsoft.teams.app
   * **Version:** 1.0.0
   * **Short description:** Enter a short description for your app
   * **Full description:** Enter a full description for your app
   * **Developer/Company Name:** Enter a company or developer name
   * **Website:** Copy your `https://{subdomain}.ngrok.io`
   * **MPN ID:** Skip this part or provide your the Microsoft Partner Network ID
   * **Privacy statement:** `https://{subdomain}.ngrok.io/privacy`
   * **Terms of use:** `https://{subdomain}.ngrok.io/termsofuse`

5. Click on `Bots` tab on the left side under `Capabilities`. Choose `Set up` and complete the setup as following:
    
    * Choose **Existing bot**
    * **Bot ID:** Select from my existing bots
    * Find the bot you created in step 3.
    * **Scope**: Personal 

    and `Save`. Your `Bot ID`, `Password` and `Bot endpoint address` should automatically appear in this page.

6. Go to `Domains and permissions` tab on the left hand side menu under `Finish` section. Enter your `Ngrok URL` in the **Enter a valid domain** and click on `Add`. 

7. Select `Test and distribute` on the left hand side menu under `Finish` section and click on `Install`.

8. Now, your bot is working on Microsoft Teams and it will appear on the personal chat. You can test your bot by chatting. Some of the example questions you may ask:
     
      "Hello",

      "Get me my customer list",
      
      "Who is the latest customer",
      
      "Help",

      "Can you breathe",

      "How old are you",

      ...

If you need any reference for Teams app manifest, you may review **manifest sample.json** under the **Teams** project folder.



