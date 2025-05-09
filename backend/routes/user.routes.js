import express from "express";
import { registerUser, loginUser, signoutUser } from "../controllers/user.controller.js";

const router = express.Router();

// User registration/signup route
router.post("/register", registerUser);

// User login route
router.post("/login", loginUser);

// Signout route
router.post("/signout", signoutUser);

export default router;
