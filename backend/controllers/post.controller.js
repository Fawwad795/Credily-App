import Post from "../models/post.model.js";
import User from "../models/user.model.js";

export const createPost = async (req, res) => {
  try {
    const { author, caption, media, tags, location, visibility } = req.body;

    const postAuthor = author || req.user._id;


    const newPost = await Post.create({
      author: postAuthor,
      caption,
      media,
      tags,
      location,
      visibility,
    });

    res.status(201).json({ success: true, post: newPost });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Edit an existing post
export const editPost = async (req, res) => {
  try {
    const { postId, userId, caption, media, tags, location, visibility } = req.body;
    // Find the post by ID
    const post = await Post.findById(postId); 
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.author.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to edit this post" });
    }
    if (caption !== undefined)  post.caption  = caption;
    if (media !== undefined)    post.media    = media;
    if (tags !== undefined)     post.tags     = tags;
    if (location !== undefined) post.location = location;
    if (visibility !== undefined) post.visibility = visibility;
    // Save and return the updated post
    const updatedPost = await post.save();
    return res.json(updatedPost);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};


export const likePost = async (req, res) => {
  try {
    const { postId, userId } = req.body;

    if (!postId || !userId) {
      return res.status(400).json({ success: false, message: "postId and userId are required" });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const alreadyLiked = post.likes.some(
      (like) => like.user.toString() === userId.toString()
    );

    if (alreadyLiked) {
      post.removeLike(userId);
      await post.save();
      return res.json({ success: true, liked: false, totalLikes: post.totalLikes });
    } else {
      post.addLike(userId);
      await post.save();
      return res.json({ success: true, liked: true, totalLikes: post.totalLikes });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



// Comment on a post
export const commentPost = async (req, res) => {
  try {
    const { postId, userId, content } = req.body;

    if (!postId || !userId || !content) {
      return res.status(400).json({ success: false, message: "postId, userId, and content are required" });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const comment = post.addComment(userId, content);
    await post.save();

    res.status(201).json({ success: true, comment, totalComments: post.totalComments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export const loadHome = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming `req.user` contains the authenticated user's ID

    // Fetch the user's friends or followers
    const user = await User.findById(userId).populate("friends followers", "_id");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Combine friends and followers into a single list of user IDs
    const connections = [
      ...new Set([...user.friends.map((f) => f._id.toString()), ...user.followers.map((f) => f._id.toString())]),
    ];

    // Fetch posts from the user's connections, sorted by the latest first
    const posts = await Post.find({ author: { $in: connections } })
      .sort({ createdAt: -1 }) // Sort by latest first
      .populate("author", "username profilePicture") // Populate author details
      .exec();

    res.status(200).json({
      success: true,
      message: "Posts loaded successfully.",
      data: posts,
    });
  } catch (error) {
    console.error("Error loading home posts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load posts.",
      error: error.message,
    });
  }
};
