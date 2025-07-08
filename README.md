# Credily App

A modern social media platform built with React and Node.js that enables users to connect, share posts, and interact with their network through an intuitive interface.

## Project Description

Credily is a full-stack social media application developed as part of the Web Technologies and Advanced Database Management Systems courses. The platform provides users with essential social networking features including user authentication, profile management, post creation and sharing, real-time interactions, and a responsive design that adapts to both light and dark themes.

The application follows modern web development practices with a clean separation between frontend and backend services, implementing secure authentication, real-time data updates, and cloud-based media storage.

<details>
<summary>Features</summary>

## Features

- **User Authentication & Registration**

  - Secure signup with username and phone number validation
  - Real-time availability checking for usernames and phone numbers
  - JWT-based authentication system
  - Password encryption using bcrypt

- **Profile Management**

  - Customizable user profiles with profile picture upload
  - Additional user information collection
  - Profile editing capabilities

- **Post Management**

  - Create and share posts with text content
  - Image upload support via Cloudinary integration
  - Post interaction features (likes, comments)
  - Real-time post updates

- **User Interface**

  - Responsive design for mobile and desktop
  - Dark/Light theme toggle
  - Modern glass-morphism design elements
  - Intuitive navigation system

- **Advanced Features**
  - Sentiment analysis integration using Google Cloud services
  - Real-time data validation
  - Debounced API calls for optimal performance
  - Cloud-based media storage

</details>

## Screenshots

The following screenshots showcase the key features and interface of the Credily application:

### Application Interface

![Screenshot 1](screenshots/Screenshot%202025-07-08%20161650.png)

![Screenshot 2](screenshots/Screenshot%202025-07-08%20161629.png)

![Screenshot 3](screenshots/Screenshot%202025-07-08%20161840.png)

_Screenshots demonstrate the user interface, featuring the login/registration system, main dashboard, post creation features, and the responsive design with dark/light theme support._

<details>
<summary>Tools & Technologies Used</summary>

### Frontend

- **React 18** - Modern JavaScript library for building user interfaces
- **Vite** - Fast build tool and development server
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **JavaScript (ES6+)** - Modern JavaScript features

### Backend

- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing library
- **Multer** - File upload middleware

### Cloud Services & APIs

- **MongoDB Atlas** - Cloud database service
- **Cloudinary** - Cloud-based image and video management
- **Google Cloud** - Sentiment analysis services

### Development Tools

- **npm** - Package manager
- **dotenv** - Environment variable management
- **CORS** - Cross-origin resource sharing
- **Nodemon** - Development server auto-restart

### Database Design

- **MongoDB Collections** - Users, Posts, Comments, Interactions
- **Indexing** - Optimized query performance
- **Data Validation** - Schema validation and constraints

</details>

<details>
<summary>Setup Instructions</summary>

## Project Structure

- `frontend/` - React frontend built with Vite
- `backend/` - Node.js backend

### Root Directory Setup

1. First, install dependencies in the root directory:
   ```
   npm install
   ```
   This will set up the necessary packages for the project root.

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
   CLOUDINARY_CLOUD_NAME=ds6xri71k
   CLOUDINARY_API_KEY=632696559246236
   CLOUDINARY_API_SECRET=PaT4mWgag51BgW_dpK835_W8Fhc   # Google Cloud credentials for sentiment analysis
   GOOGLE_APPLICATION_CREDENTIALS=./config/google-credentials.json
   USE_REAL_SENTIMENT=true
   ```

   > **Note:** The Cloudinary variables are essential for profile picture uploads and other media storage features. Create a free account at [cloudinary.com](https://cloudinary.com) to get your credentials.

3. **Google Cloud Setup:** You need to add the `google-credentials.json` file in the `backend/config` directory. This file contains the credentials for Google Cloud services used for sentiment analysis.

   If you don't add this file, sentiment analysis features will not work correctly.

4. Start the backend server:
   ```
   npm run dev
   ```
5. To test your database connection:
   ```
   node test-db-connection.js
   ```

### Supporting Different Port Configurations

Some team members use port 4000, while others use port 5000. To avoid code conflicts:

1. Use the environment variables in both frontend and backend as shown above
2. Keep `.env` files in your `.gitignore` to avoid committing personal configurations

### MongoDB Atlas Connection

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

</details>
