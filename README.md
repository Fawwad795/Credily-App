# Credily App!

This project is structured into separate frontend and backend directories.

## Project Structure

- `frontend/` - React frontend built with Vite
- `backend/` - Node.js backend

## Setup Instructions

### Frontend Setup

1. Navigate to the frontend directory and install dependencies:
   ```
   cd frontend
   npm install
   ```
2. Create a `.env` file with your API port:
   ```
   VITE_API_PORT=5000  # or 4000 based on your preference
   ```
3. Start the development server:
   ```
   npm run dev
   ```

### Backend Setup

1. Navigate to the backend directory and install dependencies:
   ```
   cd backend
   npm install
   ```
2. Create a `.env` file with:

   ```
   PORT=5000  # or 4000 based on your preference
   MONGODB_URI=your_connection_string_from_table_below
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development

   # Cloudinary credentials (required for image uploads)
   # Create an account at cloudinary.com and get these from your dashboard
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

   > **Note:** The Cloudinary variables are essential for profile picture uploads and other media storage features. Create a free account at [cloudinary.com](https://cloudinary.com) to get your credentials.

3. Start the backend server:
   ```
   npm run dev
   ```
4. To test your database connection:
   ```
   node test-db-connection.js
   ```

## Supporting Different Port Configurations

Some team members use port 4000, while others use port 5000. To avoid code conflicts:

1. Use the environment variables in both frontend and backend as shown above
2. Keep `.env` files in your `.gitignore` to avoid committing personal configurations

## MongoDB Atlas Connection

Find your connection string from the list below:

| Team Member            | Connection String                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Jahanzeb Babar         | `mongodb+srv://mbabarbscs23seecs:4231@cluster0.2wkplzo.mongodb.net/Credily?retryWrites=true&w=majority&appName=Cluster0`  |
| Shaheer Saleh          | `mongodb+srv://msalehbscs23seecs:4231@cluster0.2wkplzo.mongodb.net/Credily?retryWrites=true&w=majority&appName=Cluster0`  |
| Roshan Jalil           | `mongodb+srv://rjalilbscs23seecs:4231@cluster0.2wkplzo.mongodb.net/Credily?retryWrites=true&w=majority&appName=Cluster0`  |
| Syed Fawwad Ahmed      | `mongodb+srv://sfahmedbscs23seecs:4231@cluster0.2wkplzo.mongodb.net/Credily?retryWrites=true&w=majority&appName=Cluster0` |
| Syed Ali Hassan Jaffri | `mongodb+srv://sjaffribscs23seecs:4231@cluster0.2wkplzo.mongodb.net/Credily?retryWrites=true&w=majority&appName=Cluster0` |

### Troubleshooting Connection Issues

- Verify you're using the correct connection string
- Check your internet connection
- Confirm MongoDB Atlas service is running
- For persistent issues, contact Fawwad

> Note: The MongoDB cluster allows connections from any IP address (0.0.0.0/0). For production, we should implement more restrictive access controls.

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
