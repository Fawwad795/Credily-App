import express from "express";
import {
  createPost,
  editPost,
  likePost,
  commentPost,
} from "../controllers/post.controller.js";

const router = express.Router();

router.post("/", createPost);                 
router.put("/edit", editPost); 
router.post("/like", likePost); 
router.post("/comment", commentPost);


export default router;
