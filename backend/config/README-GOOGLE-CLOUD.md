# Google Cloud Natural Language API Setup Guide

This guide will walk you through setting up the Google Cloud Natural Language API for sentiment analysis in the Credily application.

## Prerequisites

- A Google Cloud account
- Billing enabled on your Google Cloud account (required for API usage)
- Node.js and npm installed

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "credily-sentiment-analysis")
5. Select an organization (if applicable)
6. Click "Create"
7. Wait for the project to be created and then select it

## Step 2: Enable the Natural Language API

1. Go to the [API Library](https://console.cloud.google.com/apis/library) in the Google Cloud Console
2. Search for "Natural Language API"
3. Click on the "Cloud Natural Language API" card
4. Click "Enable"
5. Wait for the API to be enabled

## Step 3: Create Service Account Credentials

1. Go to the [Credentials page](https://console.cloud.google.com/apis/credentials) in the Google Cloud Console
2. Click "Create Credentials" and select "Service Account"
3. Enter a service account name (e.g., "credily-sentiment-analysis-service")
4. Add a description (optional)
5. Click "Create and Continue"
6. In the "Grant this service account access to project" section, select the "Cloud Natural Language API User" role
7. Click "Continue"
8. Skip the "Grant users access to this service account" section and click "Done"

## Step 4: Create and Download the Service Account Key

1. On the Credentials page, find your newly created service account and click on it
2. Go to the "Keys" tab
3. Click "Add Key" and select "Create new key"
4. Choose "JSON" as the key type
5. Click "Create"
6. The JSON key file will be automatically downloaded to your computer

## Step 5: Add the Credentials to the Project

1. Rename the downloaded JSON key file to `google-credentials.json`
2. Move the file to the `credily-app/backend/config/` directory, replacing the placeholder file

## Step 6: Configure Environment Variables (Optional)

For production environments, it's recommended to use environment variables instead of storing the credentials file in the project:

1. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path of your JSON key file:

   ```bash
   # For Linux/Mac
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/google-credentials.json"

   # For Windows Command Prompt
   set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\your\google-credentials.json

   # For Windows PowerShell
   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your\google-credentials.json"
   ```

## Step 7: Usage in Development Mode

During development, if you don't want to use the actual Google Cloud API (to avoid usage charges), the application will automatically use a simplified mock sentiment analysis.

To force the use of the real API in development, set the `USE_REAL_SENTIMENT` environment variable to "true":

```bash
# For Linux/Mac
export USE_REAL_SENTIMENT=true

# For Windows Command Prompt
set USE_REAL_SENTIMENT=true

# For Windows PowerShell
$env:USE_REAL_SENTIMENT="true"
```

## Troubleshooting

- **Authentication Errors**: Make sure the service account key file is correctly placed and has the proper permissions
- **API Not Enabled**: Verify that the Natural Language API is enabled for your project
- **Billing Issues**: Ensure billing is enabled for your project
- **Quota Limits**: Check if you've exceeded your API quota in the Google Cloud Console

## Important Notes

- The free tier of the Natural Language API includes 5,000 units per month
- 1 unit = 1,000 characters of text
- Keep the credentials file secure and do not commit it to version control
- In production, use environment variables instead of storing the credentials file directly in the project
