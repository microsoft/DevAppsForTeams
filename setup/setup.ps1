$appName = "Learn Together CRM"
$domain = "localhost:4000"
$protocol = "http://"

# Authentication

# create the AAD app
"Creating AAD app $appName..."
$tabApp = az ad app create --display-name $appName --available-to-other-tenants $true --reply-urls "https://$domain" --oauth2-allow-implicit-flow --required-resource-accesses @tab-app-manifest.json | ConvertFrom-Json

# add current user as app owner
"Adding current user as app owner..."
$userId = az ad signed-in-user show --query objectId -o tsv
az ad app owner add --id $tabApp.appId --owner-object-id $userId

# Expose APIs
"Configuring API identifier URI..."
az ad app update --id $tabApp.appId --identifier-uris "api://$domain/$($tabApp.appId)"

"Configuring pre-authorized applications..."
$scopeId = az ad app show --id $tabApp.appId --query oauth2Permissions[0].id -o tsv
$preAuthorizedApplications = @"
{"id":"$($tabApp.objectId)","api":{"preAuthorizedApplications":[{"appId":"1fec8e78-bce4-4aaf-ab1b-5451cc387264","delegatedPermissionIds":["$scopeId"]},{"appId":"5e3ce6c0-2b1f-4285-8d4b-75ee78787346","delegatedPermissionIds":["$scopeId"]}]}}
"@ -replace "`"", "\`""
az rest --method patch --uri "https://graph.microsoft.com/v1.0/myorganization/applications/$($tabApp.objectId)" --body "$preAuthorizedApplications"

# set SPA redirect URL - not supported in az cli yet
"Configuring SPA on the app..."
$tabAppAuthentication = @"
{"id":"$($tabApp.objectId)","spa":{"redirectUris":["$protocol$domain"]},"publicClient":{"redirectUris":[]},"web":{"redirectUris":[],"implicitGrantSettings":{"enableAccessTokenIssuance":true,"enableIdTokenIssuance":true}}}
"@ -replace "`"", "\`""

az rest --method patch --uri "https://graph.microsoft.com/v1.0/myorganization/applications/$($tabApp.objectId)" --body "$tabAppAuthentication"

# Certificates & secrets
$tabAppSecret = az ad app credential reset --id $tabApp.appId --credential-description "Tab SSO" | ConvertFrom-Json

""
"AppId=$($tabApp.appId)"
"AppSecret=$($tabAppSecret.password)"
"AppUri=api://$domain/$($tabApp.appId)"

Write-Host DONE -ForegroundColor Green

# $tabApp.appId
# $tabApp.objectId

# PATCH https://graph.microsoft.com/v1.0/myorganization/applications/7fbcc564-db61-443e-92eb-65024d88c6a

# {"id":"7fbcc564-db61-443e-92eb-65024d88c6a7","spa":{"redirectUris":["https://localhost:3000"]},"publicClient":{"redirectUris":[]},"web":{"redirectUris":[],"implicitGrantSettings":{"enableAccessTokenIssuance":true,"enableIdTokenIssuance":true}}}