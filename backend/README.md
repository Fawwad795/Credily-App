# Credily Backend

This is the backend server for Credily, built with Express and MongoDB.

## Setup

```bash
npm install
```

You'll need to create a `.env` file in the backend directory with the following variables:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development

# Cloudinary credentials for image uploads
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Cloud credentials for sentiment analysis
GOOGLE_APPLICATION_CREDENTIALS=./config/google-credentials.json
USE_REAL_SENTIMENT=true
```

### Google Cloud Setup

You need to create and add a `google-credentials.json` file in the `backend/config` directory. This file contains the credentials for Google Cloud services used for sentiment analysis.

To get this file:

1. Create a Google Cloud project
2. Enable the Natural Language API
3. Create a service account and download the JSON key file
4. Rename the downloaded file to `google-credentials.json`
5. Place it in the `backend/config` directory

If you don't add this file, sentiment analysis features will not work correctly.

## Development

```bash
npm run dev
```

## Production

```bash
npm start
```

## Test Database Connection

```bash
npm run test:db
```

## Technologies Used

- Express
- MongoDB with Mongoose
- JWT Authentication
- bcrypt for password hashing
