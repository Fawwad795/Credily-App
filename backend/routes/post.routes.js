import express from "express";
import {
  createPost,
  editPost,
  likePost,
  commentPost,
  deletePost,
  loadHome
} from "../controllers/post.controller.js";

const router = express.Router();

router.post("/", createPost);                 
router.put("/edit", editPost); 
router.post("/like", likePost); 
router.post("/comment", commentPost);
router.post("/delete", deletePost);
router.post("/loadhome", loadHome);


export default router;
