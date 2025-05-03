import express from "express";
import { registerUser, loginUser } from "../controllers/user.controller.js";

const router = express.Router();

// User registration/signup route
router.post("/register", registerUser);

// User login route
router.post("/login", loginUser);

export default router;
