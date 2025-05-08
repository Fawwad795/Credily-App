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
```

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
