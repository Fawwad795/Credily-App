import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Connection from "../models/connection.model.js";

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

export const editPost = async (req, res) => {
  try {
    const { postId, userId, caption, media, tags, location, visibility } =
      req.body;
    // Finding the post by ID
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.author.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this post" });
    }
    if (caption !== undefined) post.caption = caption;
    if (media !== undefined) post.media = media;
    if (tags !== undefined) post.tags = tags;
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
      return res
        .status(400)
        .json({ success: false, message: "postId and userId are required" });
    }
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const alreadyLiked = post.likes.some(
      (like) => like.user.toString() === userId.toString()
    );
    if (alreadyLiked) {
      post.removeLike(userId);
      await post.save();
      return res.json({
        success: true,
        liked: false,
        totalLikes: post.totalLikes,
      });
    } else {
      post.addLike(userId);
      await post.save();
      return res.json({
        success: true,
        liked: true,
        totalLikes: post.totalLikes,
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const loadHome = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }
    const connections = await Connection.find({
      status: "accepted",
      $or: [{ requester: userId }, { recipient: userId }],
    });

    const connectionUserIds = connections.map((conn) =>
      conn.requester.toString() === userId ? conn.recipient : conn.requester
    );

    // Include the current user's posts in the feed
    connectionUserIds.push(userId);

    const posts = await Post.find({ author: { $in: connectionUserIds } })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("author", "username firstName lastName profilePicture")
      .populate({
        path: "comments.user",
        select: "username firstName lastName profilePicture",
      });

    res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.error("Error loading home feed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load home feed",
      error: error.message,
    });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .populate(
        "author",
        "username firstName lastName profilePicture phoneNumber"
      )
      .populate({
        path: "comments.user",
        select: "username firstName lastName profilePicture",
      });

    res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.error("Error loading user posts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load user posts",
      error: error.message,
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { postId, userId } = req.body;

    if (!postId || !userId) {
      return res
        .status(400)
        .json({ success: false, message: "postId and userId are required" });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this post",
      });
    }

    await Post.findByIdAndDelete(postId);
    res
      .status(200)
      .json({ success: true, message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const commentPost = async (req, res) => {
  try {
    const { postId, userId, content } = req.body;

    if (!postId || !userId || !content) {
      return res.status(400).json({
        success: false,
        message: "postId, userId, and content are required",
      });
    }

    const post = await Post.findById(postId);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    const comment = post.addComment(userId, content);
    await post.save();

    // Fetch the user data to include with the comment response
    const populatedPost = await Post.findById(postId).populate({
      path: "comments.user",
      select: "username firstName lastName profilePicture",
      options: { limit: 1, sort: { createdAt: -1 } },
    });

    // Get the last comment which is the one we just added
    const populatedComment =
      populatedPost.comments[populatedPost.comments.length - 1];

    res.status(201).json({
      success: true,
      comment: populatedComment,
      totalComments: post.totalComments,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
