import Message from "../models/message.model.js";
import User from "../models/user.model.js";

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, messageType = "text", attachments = [] } = req.body;
    const senderId = req.user._id;

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found",
      });
    }

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content,
      messageType,
      attachments,
    });

    // Get sender and receiver details
    const [sender, receiverUser] = await Promise.all([
      User.findById(senderId).select("username"),
      User.findById(receiverId).select("username"),
    ]);

    const messageWithUsernames = {
      ...message.toObject(),
      sender: {
        _id: sender._id,
        username: sender.username,
      },
      receiver: {
        _id: receiverUser._id,
        username: receiverUser.username,
      },
    };

    // Use the new socket utility function for real-time delivery
    if (req.socketEmitNewMessage) {
      console.log("Emitting new message via socket utility");
      req.socketEmitNewMessage(receiverId.toString(), messageWithUsernames);
    } else {
      // Fallback to direct socket emission if utility not available
      console.log("Using direct socket emission for new message");
      req.io.to(receiverId.toString()).emit("newMessage", messageWithUsernames);
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: messageWithUsernames,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

// Get conversation between two users
export const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    console.log("Fetching conversation between:", {
      currentUserId,
      otherUserId: userId
    });

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get all unique user IDs from messages
    const userIds = [...new Set(messages.flatMap(msg => [msg.sender, msg.receiver]))];
    
    // Get all users' usernames
    const users = await User.find({ _id: { $in: userIds } }).select('username');
    const userMap = users.reduce((acc, user) => {
      acc[user._id.toString()] = user.username;
      return acc;
    }, {});

    // Add usernames to messages and ensure proper sender/receiver distinction
    const messagesWithUsernames = messages.map(msg => {
      const isCurrentUserSender = msg.sender.toString() === currentUserId.toString();
      console.log("Processing message:", {
        messageId: msg._id,
        senderId: msg.sender.toString(),
        currentUserId: currentUserId.toString(),
        isCurrentUserSender
      });

      return {
        ...msg.toObject(),
        sender: {
          _id: msg.sender,
          username: userMap[msg.sender.toString()],
          isCurrentUser: isCurrentUserSender
        },
        receiver: {
          _id: msg.receiver,
          username: userMap[msg.receiver.toString()],
          isCurrentUser: !isCurrentUserSender
        }
      };
    });

    // Mark unread messages as read
    const unreadMessages = await Message.updateMany(
      {
        sender: userId,
        receiver: currentUserId,
        isRead: false,
      },
      { isRead: true }
    );

    // If there were unread messages, update unread counts via socket
    if (unreadMessages.modifiedCount > 0) {
      // Emit read status updates
      if (req.io) {
        req.io.to(userId.toString()).emit("messagesRead", {
          chatId: currentUserId.toString(),
          count: unreadMessages.modifiedCount
        });
      }
    }

    const total = await Message.countDocuments({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    });

    res.status(200).json({
      success: true,
      data: {
        messages: messagesWithUsernames.reverse(),
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversation",
      error: error.message,
    });
  }
};

// Get all conversations for current user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all conversations where the user is either sender or receiver
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { receiver: userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", userId] },
              "$receiver",
              "$sender"
            ]
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ["$receiver", userId] },
                  { $eq: ["$isRead", false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          _id: 1,
          user: {
            _id: 1,
            username: 1,
            email: 1,
            profilePicture: 1
          },
          lastMessage: 1,
          unreadCount: 1
        }
      },
      {
        $sort: { "lastMessage.createdAt": -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
      error: error.message
    });
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user._id; // Assuming you have authentication middleware

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this message",
      });
    }

    await message.deleteOne();

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
      error: error.message,
    });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Count unread messages where the user is the receiver
    const unreadCount = await Message.countDocuments({
      receiver: userId,
      isRead: false
    });

    res.status(200).json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
      error: error.message
    });
  }
};

// Add this function to your controller file:

export const getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all messages for this user (either as sender or receiver)
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('sender', 'username email profilePicture')
    .populate('receiver', 'username email profilePicture');

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message
    });
  }
};