# Credily App

This project has been restructured into separate frontend and backend directories.

## Project Structure

- `frontend/` - React frontend built with Vite
- `backend/` - Node.js backend

## Instructions After Pulling Changes

After pulling the latest changes, follow these steps:

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the backend directory with the following content:
   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://username:password@cluster-name.mongodb.net/Credily?retryWrites=true&w=majority
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   ```
4. Start the backend server:
   ```
   npm run dev
   ```

## MongoDB Atlas Connection Setup

To connect to the shared MongoDB Atlas cluster containing the Credily database, follow these steps:

1. **Use Your Assigned Connection String**

   - Find your connection string from the list below based on your username
   - All users have been created with the same access permissions (readWriteAnyDatabase)

   | Team Member            | Connection String                                                                                                         |
   | ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
   | Jahanzeb Babar         | `mongodb+srv://mbabarbscs23seecs:4231@cluster0.2wkplzo.mongodb.net/Credily?retryWrites=true&w=majority&appName=Cluster0`  |
   | Shaheer Saleh          | `mongodb+srv://msalehbscs23seecs:4231@cluster0.2wkplzo.mongodb.net/Credily?retryWrites=true&w=majority&appName=Cluster0`  |
   | Roshan Jalil           | `mongodb+srv://rjalilbscs23seecs:4231@cluster0.2wkplzo.mongodb.net/Credily?retryWrites=true&w=majority&appName=Cluster0`  |
   | Syed Fawwad Ahmed      | `mongodb+srv://sfahmedbscs23seecs:4231@cluster0.2wkplzo.mongodb.net/Credily?retryWrites=true&w=majority&appName=Cluster0` |
   | Syed Ali Hassan Jaffri | `mongodb+srv://sjaffribscs23seecs:4231@cluster0.2wkplzo.mongodb.net/Credily?retryWrites=true&w=majority&appName=Cluster0` |

2. **Configure Your Local Environment**

   - Create a `.env` file in the `backend` directory if you haven't already
   - Add your connection string to your `.env` file:
     ```
     MONGODB_URI=your_connection_string_from_table_above
     PORT=5000
     JWT_SECRET=your_jwt_secret
     NODE_ENV=development
     ```

3. **Testing Your Connection**

   - Run the database connection test:
     ```
     cd backend
     node test-db-connection.js
     ```
   - If successful, you'll see the message: "MongoDB Connected: [host-name] (Database: Credily)"

4. **Troubleshooting Connection Issues**
   - If you cannot connect, check that:
     - You're using the correct connection string
     - Your internet connection is stable
     - MongoDB Atlas service is up and running
   - For persistent issues, check the MongoDB Atlas status page or contact Fawwad :)

> Note: The MongoDB cluster has been configured to allow connections from any IP address (0.0.0.0/0). While this is convenient for development, we should implement more restrictive access controls for production.

## Original React + Vite Documentation

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
