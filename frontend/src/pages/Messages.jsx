import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../utils/axios"; // Import the configured axios instance
import Nav from "../components/Nav";
import socket from "../utils/socket";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";

const MessagingPage = () => {
  // Use local storage for user auth or implement proper auth
  const [currentUser, setCurrentUser] = useState({
    id: localStorage.getItem("userId") || "123",
    email: localStorage.getItem("userEmail") || "user@example.com",
  });

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // Helper function to get socket user by socket ID
  const getUserBySocketId = (socketId) => {
    return onlineUsers.find((user) => user.socketId === socketId);
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up socket connection status
  useEffect(() => {
    // Check if token exists
    const token = localStorage.getItem("token");
    console.log("Auth token exists:", !!token);

    // If no token, create a temporary one for testing
    if (!token) {
      console.log(
        "No auth token found - creating a temporary token for testing"
      );
      // This is just for debugging - in production, you'd redirect to login
      localStorage.setItem("token", "temporary-test-token");
    }

    const handleConnect = () => {
      setIsConnected(true);
      console.log("Socket.IO connected successfully!");
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log("Socket.IO disconnected");
    };

    const handleError = (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
      setFallbackMode(true);
    };

    // Register socket event listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleError);

    // Check initial connection state
    setIsConnected(socket.connected);

    // Check if user info exists in localStorage and update if needed
    const userId = localStorage.getItem("userId");
    const userEmail = localStorage.getItem("userEmail");

    if (
      userId &&
      userEmail &&
      (userId !== currentUser.id || userEmail !== currentUser.email)
    ) {
      setCurrentUser({
        id: userId,
        email: userEmail,
      });
    }

    // Clean up event listeners
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleError);
    };
  }, [currentUser.id, currentUser.email]);

  // Define fetchMessagesFromApi with useCallback to avoid dependency cycles
  const fetchMessagesFromApi = useCallback(async () => {
    if (selectedChat) {
      try {
        console.log("Polling for new messages...");
        const response = await api.get(
          `/messages/conversation/${selectedChat.id}`
        );
        if (response.data && response.data.success) {
          setMessages(
            response.data.data.messages.map((msg) => ({
              id: msg._id,
              sender:
                typeof msg.sender === "object" && msg.sender !== null
                  ? msg.sender._id
                  : msg.sender,
              content: msg.content,
              timestamp: msg.createdAt,
              isRead: msg.isRead,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching messages in fallback mode:", error);
        // No need to set mock data here since it will constantly poll
      }
    }

    // Also update unread counts
    try {
      const unreadResponse = await api.get("/messages/unread-count");
      if (unreadResponse.data && unreadResponse.data.success) {
        setUnreadCount(unreadResponse.data.data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching unread count in fallback mode:", error);
    }

    // Fetch latest chats too
    fetchChatsList();
  }, [selectedChat]);

  // Function to fetch chats list
  const fetchChatsList = useCallback(async () => {
    try {
      console.log("Fetching chats list...");
      const chatsResponse = await api.get("/messages/conversations");
      if (chatsResponse.data && chatsResponse.data.success) {
        console.log("Successfully fetched chats list:", chatsResponse.data.data);
        
        // Process and normalize the chat data
        const formattedChats = chatsResponse.data.data.map(chat => {
          // Extract key data from the chat object
          const id = chat._id?.toString() || chat.id?.toString() || "";
          const name = chat.user?.username || chat.name || "";
          const email = chat.user?.email || chat.email || "";
          const profilePicture = chat.user?.profilePicture || chat.profilePicture || "";
          
          // Extract and format the last message
          let lastMessage = "";
          if (chat.lastMessage?.content) {
            lastMessage = chat.lastMessage.content;
          } else if (typeof chat.lastMessage === 'string') {
            lastMessage = chat.lastMessage;
          }
          
          // Get proper timestamp
          let timestamp = new Date();
          if (chat.lastMessage?.createdAt) {
            timestamp = new Date(chat.lastMessage.createdAt);
          } else if (chat.timestamp) {
            timestamp = new Date(chat.timestamp);
          }
          
          // Count unread messages
          const unreadCount = chat.unreadCount || 0;
          
          return {
            id,
            name,
            email,
            profilePicture,
            lastMessage,
            timestamp,
            unreadCount
          };
        });
        
        // Sort chats by timestamp (most recent first)
        formattedChats.sort((a, b) => b.timestamp - a.timestamp);
        
        console.log("Formatted chats list:", formattedChats);
        
        // Merge with existing chats to avoid losing local updates
        setChats(prevChats => {
          // Build a map of existing chats
          const existingChatsMap = new Map();
          prevChats.forEach(chat => {
            existingChatsMap.set(chat.id, chat);
          });
          
          // Update with new data, preserving local updates if more recent
          const mergedChats = formattedChats.map(newChat => {
            const existingChat = existingChatsMap.get(newChat.id);
            
            if (existingChat) {
              // If our local version has a more recent timestamp, use its data
              if (existingChat.timestamp > newChat.timestamp) {
                return existingChat;
              }
              
              // If we have selected this chat, preserve the unread count (0)
              if (selectedChat && selectedChat.id === newChat.id) {
                return {
                  ...newChat,
                  unreadCount: 0
                };
              }
            }
            
            return newChat;
          });
          
          return mergedChats;
        });
      }
    } catch (error) {
      console.error("Error fetching chat list:", error);
    }
  }, [selectedChat]);

  // Listen for messages and online users
  useEffect(() => {
    // Listen for online users
    socket.on("getUsers", (users) => {
      console.log("Online users received:", users);
      if (Array.isArray(users)) {
        setOnlineUsers(users);
      }
    });

    // Listen for new messages (MongoDB format)
    socket.on("newMessage", (message) => {
      console.log("New message received:", message);
      if (!message) return;

      const formattedMessage = {
        id: message._id || Date.now().toString(),
        sender: {
          _id: message.sender._id || message.sender,
          isCurrentUser: message.sender._id === currentUser.id || 
                         message.sender === currentUser.id,
        },
        content: message.content,
        timestamp: message.createdAt || new Date().toISOString(),
        isRead: message.isRead || false,
      };

      console.log("Formatted message:", formattedMessage);

      // Determine the other user ID (sender or receiver)
      let otherUserId;
      let otherUserName;
      let otherUserEmail;
      let otherUserPic;
      const isSender = formattedMessage.sender.isCurrentUser;
      
      if (isSender) {
        // We sent the message, so other user is the receiver
        otherUserId = message.receiver._id || message.receiver;
        otherUserName = message.receiver.username || "";
        otherUserEmail = message.receiver.email || "";
        otherUserPic = message.receiver.profilePicture || "";
      } else {
        // We received the message, so other user is the sender
        otherUserId = formattedMessage.sender._id;
        otherUserName = message.sender.username || "";
        otherUserEmail = message.sender.email || "";
        otherUserPic = message.sender.profilePicture || "";
      }

      console.log("Other user identified:", {
        id: otherUserId, 
        name: otherUserName,
        isSender: isSender
      });

      // Add message to current chat if selected
      if (selectedChat && selectedChat.id === otherUserId) {
        console.log("Adding message to selected chat");
        setMessages(prev => [...prev, formattedMessage]);
        
        // Mark message as read if we're in the chat and we received it
        if (!isSender) {
          socket.emit("markAsRead", {
            messageId: formattedMessage.id,
            chatId: selectedChat.id
          });
        }
      } else if (!isSender) {
        // Update unread count for other chats only for incoming messages
        console.log("Updating unread count for other chat");
        setUnreadCount(prev => prev + 1);
      }

      // Always update chat list with new message
      setChats(prevChats => {
        // Find the chat to update
        const chatId = otherUserId;
        const chatIndex = prevChats.findIndex(chat => 
          chat.id === chatId || 
          chat._id === chatId ||
          chat.email === otherUserEmail
        );

        console.log(`Updating chat list: found chat at index ${chatIndex}`);

        if (chatIndex >= 0) {
          // Update existing chat
          const updatedChats = [...prevChats];
          const existingChat = updatedChats[chatIndex];
          
          // Create updated chat object
          const updatedChat = {
            ...existingChat,
            id: otherUserId, // Ensure consistent ID
            lastMessage: formattedMessage.content,
            timestamp: formattedMessage.timestamp,
            // Only increment unread if we received the message and chat is not selected
            unreadCount: !isSender && (!selectedChat || selectedChat.id !== chatId)
              ? (existingChat.unreadCount || 0) + 1
              : existingChat.unreadCount || 0,
          };

          // Remove the old chat
          updatedChats.splice(chatIndex, 1);
          
          // Add the updated chat to the beginning
          updatedChats.unshift(updatedChat);
          
          console.log("Updated chat list with new message");
          return updatedChats;
        } else {
          // Chat doesn't exist yet, create a new chat entry
          const newChat = {
            id: otherUserId,
            name: otherUserName,
            email: otherUserEmail,
            profilePicture: otherUserPic,
            lastMessage: formattedMessage.content,
            timestamp: formattedMessage.timestamp,
            unreadCount: !isSender ? 1 : 0,
          };
          
          // Add new chat to beginning of list
          console.log("Adding new chat to list:", newChat);
          return [newChat, ...prevChats];
        }
      });
    });

    // Listen for message read status updates
    socket.on("messageRead", ({ messageId, chatId }) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    });

    // Listen for messages being read by the other user
    socket.on("messagesRead", ({ chatId, count }) => {
      console.log(`${count} messages read in chat ${chatId}`);
      // Update UI to reflect read messages
    });

    // Listen for message acknowledgments
    socket.on("messageReceived", (data) => {
      console.log("Message receipt acknowledged:", data);
    });

    // Clean up event listeners
    return () => {
      socket.off("getUsers");
      socket.off("newMessage");
      socket.off("messageRead");
      socket.off("messagesRead");
      socket.off("messageReceived");
    };
  }, [selectedChat, currentUser.id, fetchChatsList]);

  // Connect to socket and join user room
  useEffect(() => {
    // Set a timeout to check if socket connects
    const connectionTimeout = setTimeout(() => {
      if (!isConnected) {
        setFallbackMode(true);
        console.log("Using fallback polling mode for messages");
      }
    }, 5000);

    function onConnect() {
      setIsConnected(true);
      setFallbackMode(false);
      clearTimeout(connectionTimeout);

      // Connect with both ID and email immediately after connecting
      socket.emit("joinRoom", currentUser.id);
      socket.emit("addUser", {
        userId: currentUser.id,
        userEmail: currentUser.email
      });
      
      // Register for new messages
      socket.emit("registerForNewMessages", currentUser.id);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // Check initial connection state
    if (socket.connected) {
      setIsConnected(true);
      // If already connected, join room
      socket.emit("joinRoom", currentUser.id);
      socket.emit("addUser", {
        userId: currentUser.id,
        userEmail: currentUser.email
      });
      
      // Register for new messages
      socket.emit("registerForNewMessages", currentUser.id);
    }

    return () => {
      clearTimeout(connectionTimeout);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [currentUser.id, currentUser.email, isConnected]);

  // Use fallback mode if socket connection fails
  useEffect(() => {
    let interval;

    if (fallbackMode) {
      // Set up polling for messages and chats instead of relying on socket
      interval = setInterval(() => {
        // Fetch messages using REST API if a chat is selected
        if (selectedChat) {
          fetchMessagesFromApi();
        }
        
        // Always fetch latest chats to keep the list updated
        fetchChatsList();
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fallbackMode, selectedChat, fetchMessagesFromApi, fetchChatsList]);

  // Regularly update chat list even if not in fallback mode
  useEffect(() => {
    // Initial fetch
    fetchChatsList();
    
    // Set up polling for chat list at a reasonable interval
    const interval = setInterval(() => {
      fetchChatsList();
    }, 10000); // Every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        // Use your actual endpoint
        const response = await api.get("/messages/unread-count");
        if (response.data && response.data.success) {
          setUnreadCount(response.data.data.unreadCount);
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
        // Default to 0 or the current state
      }
    };

    fetchUnreadCount();
  }, []);

  // Fetch messages for selected chat
  useEffect(() => {
    if (selectedChat) {
      const fetchMessages = async () => {
        try {
          const response = await api.get(
            `/messages/conversation/${selectedChat.id}`
          );
          if (response.data && response.data.success) {
            console.log("Fetched messages:", response.data.data.messages);
            setMessages(response.data.data.messages);
            
            // When a chat is selected, its unread count should be zero
            setChats(prevChats =>
              prevChats.map(chat =>
                chat.id === selectedChat.id
                  ? { ...chat, unreadCount: 0 }
                  : chat
              )
            );
            
            // Update overall unread count
            let newUnreadCount = 0;
            for (const chat of chats) {
              if (chat.id !== selectedChat.id) {
                newUnreadCount += chat.unreadCount || 0;
              }
            }
            setUnreadCount(newUnreadCount);
          }
        } catch (error) {
          console.error("Error fetching messages:", error);
        }
      };

      fetchMessages();
    }
  }, [selectedChat, chats]);

  useEffect(() => {
    if (location.state && location.state.userId) {
      // Try to select the chat with this user
      setSelectedChat({
        id: location.state.userId,
        name: location.state.username,
        email: location.state.email,
        profilePicture: location.state.profilePicture,
      });
    }
  }, [location.state]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat) return;

    const newMessage = {
      id: Date.now().toString(),
      content: messageInput,
      timestamp: new Date().toISOString(),
      isRead: false,
      sender: {
        _id: currentUser.id,
        isCurrentUser: true,
      },
    };

    // Optimistically update UI immediately
    setMessages(prev => [...prev, newMessage]);
    setMessageInput("");

    // Update chat list immediately
    setChats(prevChats => {
      const updatedChats = prevChats.map(chat =>
        chat.id === selectedChat.id
          ? {
              ...chat,
              lastMessage: messageInput,
              timestamp: new Date().toISOString(),
              unreadCount: 0,
            }
          : chat
      );

      // Move updated chat to top
      const chatIndex = updatedChats.findIndex(
        chat => chat.id === selectedChat.id
      );
      if (chatIndex > 0) {
        const chatToMove = updatedChats.splice(chatIndex, 1)[0];
        updatedChats.unshift(chatToMove);
      }

      return updatedChats;
    });

    try {
      const response = await api.post("/messages", {
        receiverId: selectedChat.id,
        content: messageInput,
        messageType: "text",
      });

      if (response.data?.success) {
        const serverMessage = response.data.data;
        console.log("Server response for sent message:", serverMessage);

        // Update message with server data
        setMessages(prev =>
          prev.map(msg =>
            msg.id === newMessage.id
              ? {
                  ...msg,
                  id: serverMessage._id,
                  timestamp: serverMessage.createdAt || new Date().toISOString(),
                }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Revert optimistic update on error
      setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
    }
  };

  // Handle selecting a chat
  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    
    // Mark chat as read when selected and update unread count
    setChats(prevChats => {
      const updatedChats = prevChats.map(c => 
        c.id === chat.id 
          ? { ...c, unreadCount: 0 } 
          : c
      );
      
      // Calculate new total unread count
      let newUnreadCount = 0;
      for (const c of updatedChats) {
        if (c.id !== chat.id) {
          newUnreadCount += c.unreadCount || 0;
        }
      }
      setUnreadCount(newUnreadCount);
      
      return updatedChats;
    });
  };

  // Generate placeholder images for profiles
  const generateProfilePlaceholder = (name) => {
    const initial = name ? name.charAt(0).toUpperCase() : "U";
    return `https://placehold.co/50/blue/white?text=${initial}`;
  };

  // Handle image loading errors
  const handleImageError = (e, name) => {
    e.target.onerror = null; // Prevent infinite callbacks
    e.target.src = generateProfilePlaceholder(name);
  };

  const filteredChats = chats
    .map((chat) => ({
      id: chat.id || chat._id,
      name: chat.name || chat.user?.username || "",
      email: chat.email || chat.user?.email || "",
      profilePicture: chat.profilePicture || chat.user?.profilePicture || "",
      lastMessage: chat.lastMessage || "",
      timestamp: chat.timestamp || new Date(),
      unreadCount: chat.unreadCount || 0,
    }))
    .filter(
      (chat) =>
        chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Sort chats by timestamp (most recent first)
  const sortedChats = [...filteredChats].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  // Format message timestamps
  const formatMessageTime = (timestamp) => {
    try {
      // Check if timestamp is valid
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        console.error("Invalid timestamp:", timestamp);
        return "";
      }

      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // If today, show only time
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } 
      // If yesterday, show "Yesterday" and time
      else if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday ${date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      } 
      // If this year, show month and day
      else if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        });
      } 
      // Otherwise show full date
      else {
        return date.toLocaleDateString([], {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // Format chat timestamps
  const formatChatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        console.error("Invalid chat timestamp:", timestamp);
        return "";
      }

      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // If today, show only time
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } 
      // If yesterday, show "Yesterday"
      else if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      } 
      // If within last 7 days, show day name
      else if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
        return date.toLocaleDateString([], { weekday: 'short' });
      } 
      // Otherwise show date
      else {
        return date.toLocaleDateString([], {
          month: "numeric",
          day: "numeric",
          year: "2-digit"
        });
      }
    } catch (error) {
      console.error("Error formatting chat date:", error);
      return "";
    }
  };

  // Update chat list with new message
  useEffect(() => {
    if (selectedChat) {
      // Update selected chat in the list when new messages are added
      setChats(prevChats => {
        const selectedChatIndex = prevChats.findIndex(chat => chat.id === selectedChat.id);
        if (selectedChatIndex >= 0 && messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          
          // Create a new array to trigger a re-render
          const updatedChats = [...prevChats];
          updatedChats[selectedChatIndex] = {
            ...updatedChats[selectedChatIndex],
            lastMessage: lastMessage.content,
            timestamp: lastMessage.timestamp,
            unreadCount: 0 // Selected chat should have no unread messages
          };
          
          return updatedChats;
        }
        return prevChats;
      });
    }
  }, [selectedChat, messages]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar (Navbar) */}
      <Nav />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        {/* Header removed */}

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-1/3 bg-gray-50 shadow-md rounded-l-lg overflow-y-auto">
            <div className="flex justify-between items-center p-4">
              <h2 className="text-xl font-bold">Chats</h2>
              {unreadCount > 0 && (
                <span className="text-sm bg-red-500 text-white px-3 py-1 rounded-full">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <div className="px-4 pb-2">
              <input
                type="text"
                placeholder="Search followers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <ul>
              {sortedChats.map((chat) => (
                <li
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-100 ${
                    selectedChat?.id === chat.id ? "bg-gray-100" : ""
                  }`}
                >
                  <div className="relative">
                    <img
                      src={chat.profilePicture || "/default-profile.png"}
                      alt={chat.name}
                      className="w-12 h-12 rounded-full"
                      onError={(e) => handleImageError(e, chat.name)}
                    />
                    {onlineUsers.some(
                      (u) => u.userId === chat.id || u.email === chat.email
                    ) && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full"></span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">
                        {chat.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatChatTime(chat.timestamp)}
                      </span>
                    </div>
                    <p className={`text-sm ${chat.unreadCount > 0 ? "font-medium text-gray-700" : "text-gray-500"} truncate`}>
                      {chat.lastMessage}
                    </p>
                    {chat.unreadCount > 0 && (
                      <span className="text-sm bg-red-500 text-white px-2 py-1 rounded-full">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div
                  className="p-4 w-full bg-gray-50 text-gray-800 shadow-md sticky top-0 z-10 cursor-pointer"
                  onClick={() => navigate(`/profile/${selectedChat.id}`)}
                >
                  <div className="flex items-center">
                    <img
                      src={
                        selectedChat.profilePicture || "/default-profile.png"
                      }
                      alt={selectedChat.name}
                      className="w-10 h-10 rounded-full mr-3"
                      onError={(e) => handleImageError(e, selectedChat.name)}
                    />
                    <div>
                      <h2 className="text-lg font-bold">{selectedChat.name}</h2>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                  <div className="flex flex-col space-y-2">
                    {messages.map((message) => {
                      console.log("Rendering message:", {
                        messageId: message.id,
                        sender: message.sender,
                        isCurrentUser: message.sender.isCurrentUser,
                        timestamp: message.timestamp,
                      });

                      const isCurrentUser = message.sender.isCurrentUser;

                      // Get proper formatted timestamp for this message
                      const messageTime = formatMessageTime(message.timestamp);

                      // Check if we should display a date separator
                      const showDateSeparator = (index) => {
                        if (index === 0) return true;
                        
                        const currentDate = new Date(message.timestamp);
                        const prevDate = new Date(messages[index - 1].timestamp);
                        
                        // Return true if the dates are different
                        return currentDate.toDateString() !== prevDate.toDateString();
                      };

                      return (
                        <React.Fragment key={message.id}>
                          {/* Add date separator if needed */}
                          {showDateSeparator(messages.indexOf(message)) && (
                            <div className="flex justify-center my-2">
                              <div className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600">
                                {new Date(message.timestamp).toLocaleDateString([], {
                                  weekday: 'long',
                                  month: 'short',
                                  day: 'numeric',
                                  year: new Date(message.timestamp).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* Message bubble */}
                          <div
                            className={`flex w-full ${
                              isCurrentUser ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                                isCurrentUser
                                  ? "bg-red-300 text-gray-800 rounded-tr-none"
                                  : "bg-purple-200 text-black rounded-tl-none shadow-sm"
                              }`}
                            >
                              <p className="text-sm break-words">
                                {message.content}
                              </p>
                              <div className="flex items-center justify-end mt-1 space-x-1">
                                <p className="text-xs text-gray-600">
                                  {messageTime}
                                </p>
                                {isCurrentUser && (
                                  <span className="text-xs">
                                    {message.isRead ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M9.707 14.707a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L9 12.586l7.293-7.293a1 1 0 011.414 1.414l-8 8z" />
                                      </svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M9.707 14.707a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L9 12.586l7.293-7.293a1 1 0 011.414 1.414l-8 8z" />
                                      </svg>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Message Input */}
                <div className="p-4 bg-white border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      placeholder="Message..."
                      className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:grad text-sm"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      className={`p-2 rounded-full ${
                        messageInput.trim()
                          ? "grad text-white hover:grad"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      } transition duration-200`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill=""
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500">
                  Select a chat to start messaging
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default MessagingPage;
