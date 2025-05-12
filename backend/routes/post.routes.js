import express from "express";
import {
  createPost,
  editPost,
  likePost,
  commentPost,
  deletePost,
  loadHome,
  getUserPosts,
} from "../controllers/post.controller.js";


const router = express.Router();

router.post("/", createPost);
router.put("/edit", editPost);
router.post("/like", likePost);
router.post("/comment", commentPost);
router.post("/delete", deletePost);
router.post("/loadhome", loadHome);
router.get("/userposts", getUserPosts); 
router.get("/home",  loadHome);

export default router;
