import express from "express";
import {
  createPost,
  editPost,
  likePost,
  commentPost,
  loadHome
} from "../controllers/post.controller.js";
import { protect } from "../middlewares/authMiddleware.js"; // Assuming you have an auth middleware

const router = express.Router();

router.post("/", createPost);                 
router.put("/edit", editPost); 
router.post("/like", likePost); 
router.post("/comment", commentPost);

// Route to load home posts
router.get("/home", protect, loadHome);

export default router;
