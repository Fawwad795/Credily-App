import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
        formattedChats.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        console.log("Formatted chats list:", formattedChats);
        
        // Update state with new chats
        setChats(formattedChats);
      }
    } catch (error) {
      console.error("Error fetching chat list:", error);
    }
  }, []);

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
    const handleNewMessage = (message) => {
      console.log("New message received via socket:", message);
      if (!message) return;

      // Ignore messages with invalid format
      if (!message.sender || !message.content) {
        console.error("Invalid message format received:", message);
        return;
      }

      // Format the message to match our expected structure
      const formattedMessage = {
        _id: message._id || Date.now().toString(),
        content: message.content,
        createdAt: message.createdAt || new Date().toISOString(),
        isRead: message.isRead || false,
        sender: {
          _id: typeof message.sender === 'object' ? message.sender._id : message.sender,
          isCurrentUser: typeof message.sender === 'object' 
            ? message.sender._id === currentUser.id
            : message.sender === currentUser.id
        },
        receiver: message.receiver
      };

      // Determine if it's a sent or received message
      const isSentByMe = formattedMessage.sender.isCurrentUser;
      
      // Determine other user ID (for chat identification)
      let otherUserId;
      let otherUserDetails = null;
      
      if (isSentByMe) {
        // If we sent it, the other user is the receiver
        otherUserId = typeof message.receiver === 'object' ? message.receiver._id : message.receiver;
        otherUserDetails = message.receiver;
      } else {
        // If we received it, the other user is the sender
        otherUserId = formattedMessage.sender._id;
        otherUserDetails = message.sender;
      }

      console.log("Message belongs to:", {
        otherUserId,
        selectedChatId: selectedChat?.id,
        isSentByMe,
        shouldAddToMessages: selectedChat && selectedChat.id === otherUserId
      });

      // Only add to current messages if it belongs to the selected chat
      if (selectedChat && selectedChat.id === otherUserId) {
        console.log("Adding message to current chat:", selectedChat.id);
        // Check if this message already exists to avoid duplicates
        setMessages(prev => {
          // Check if message already exists by ID
          const exists = prev.some(m => m._id === formattedMessage._id);
          if (exists) {
            console.log("Message already exists in chat, skipping:", formattedMessage._id);
            return prev;
          }
          return [...prev, formattedMessage];
        });
        
        // Mark as read if we're the receiver
        if (!isSentByMe) {
          socket.emit("markAsRead", {
            messageId: formattedMessage._id,
            chatId: selectedChat.id
          });
        }
      } else if (!isSentByMe) {
        // If received and not in current chat, increment unread count
        setUnreadCount(prev => prev + 1);
      }

      // Update chat list to ensure most recent chat is at the top
      setChats(prevChats => {
        // Find if chat exists
        const chatIndex = prevChats.findIndex(chat => 
          chat.id === otherUserId
        );
        
        // Create new chats array
        const updatedChats = [...prevChats];

        if (chatIndex >= 0) {
          // Update existing chat
          const existingChat = updatedChats[chatIndex];
          
          // Create updated version with new message
          const updatedChat = {
            ...existingChat,
            lastMessage: formattedMessage.content,
            timestamp: new Date().toISOString(), // Always use current time for sorting
            unreadCount: !isSentByMe && (!selectedChat || selectedChat.id !== otherUserId)
              ? (existingChat.unreadCount || 0) + 1
              : existingChat.unreadCount || 0
          };
          
          // Remove from current position
          updatedChats.splice(chatIndex, 1);
          
          // Add to the beginning (most recent)
          updatedChats.unshift(updatedChat);
        } else {
          // Chat doesn't exist, create new one
          const newChat = {
            id: otherUserId,
            name: otherUserDetails?.username || "User",
            email: otherUserDetails?.email || "",
            profilePicture: otherUserDetails?.profilePicture || "",
            lastMessage: formattedMessage.content,
            timestamp: new Date().toISOString(),
            unreadCount: !isSentByMe ? 1 : 0
          };
          
          // Add to the beginning
          updatedChats.unshift(newChat);
        }
        
        return updatedChats;
      });
    };
    
    // Listen for messages
    socket.on("newMessage", handleNewMessage);
    socket.on("messageReceived", (data) => {
      console.log("Message delivered confirmation:", data);
    });
    
    // Cleanup
    return () => {
      socket.off("getUsers");
      socket.off("newMessage", handleNewMessage);
      socket.off("messageReceived");
    };
  }, [currentUser.id, selectedChat]);

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

  // Modify the useEffect that fetches the chat list to always sort by timestamp
  useEffect(() => {
    // Initial fetch
    fetchChatsList();
    
    // Set up polling for chat list at a reasonable interval
    const interval = setInterval(() => {
      fetchChatsList();
    }, 10000); // Every 10 seconds
    
    return () => clearInterval(interval);
  }, [fetchChatsList]);

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

    // Format message with proper structure to match backend format
    const newMessage = {
      _id: Date.now().toString(), // Will be replaced with server ID later
      content: messageInput,
      createdAt: new Date().toISOString(),
      isRead: false,
      sender: {
        _id: currentUser.id,
        isCurrentUser: true
      },
      receiver: selectedChat.id,
    };

    console.log("Adding optimistic message to UI:", newMessage);

    // Optimistically update UI immediately - add to messages array
    setMessages(prev => [...prev, newMessage]);
    setMessageInput("");

    // Update chat list immediately - Always move chat to top on new message
    setChats(prevChats => {
      // Find the chat to update
      const chatIndex = prevChats.findIndex(chat => chat.id === selectedChat.id);
      
      if (chatIndex === -1) return prevChats; // Chat not found
      
      // Create a copy of the chats array
      const updatedChats = [...prevChats];
      
      // Update the chat with latest message details
      const updatedChat = {
        ...updatedChats[chatIndex],
        lastMessage: messageInput,
        timestamp: new Date().toISOString(),
        unreadCount: 0, // Messages sent by current user are already read
      };
      
      // Remove the chat from its current position
      updatedChats.splice(chatIndex, 1);
      
      // Add it to the top of the list
      updatedChats.unshift(updatedChat);
      
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
            msg._id === newMessage._id
              ? {
                  ...msg,
                  _id: serverMessage._id,
                  createdAt: serverMessage.createdAt || new Date().toISOString(),
                }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Revert optimistic update on error
      setMessages(prev => prev.filter(msg => msg._id !== newMessage._id));
    }
  };

  // Handle selecting a chat
  const handleSelectChat = (chat) => {
    // Clear messages immediately to avoid showing old messages
    setMessages([]);
    
    // Update the selected chat
    setSelectedChat(chat);
    
    // Reset unread count for this chat immediately
    setChats(prevChats => {
      return prevChats.map(c => 
        c.id === chat.id 
          ? { ...c, unreadCount: 0 } 
          : c
      );
    });
    
    // Update the total unread count
    setUnreadCount(prevCount => {
      // Calculate the new total by subtracting this chat's unread count
      const newTotal = Math.max(0, prevCount - (chat.unreadCount || 0));
      return newTotal;
    });
    
    // Fetch messages for this chat immediately
    if (chat.id) {
      (async () => {
        try {
          console.log("Fetching messages for newly selected chat:", chat.id);
          const response = await api.get(`/messages/conversation/${chat.id}`);
          if (response.data && response.data.success) {
            console.log("Fetched messages for chat:", chat.id, response.data.data.messages);
            // Set messages from API response
            setMessages(response.data.data.messages || []);
          } else {
            console.error("Failed to fetch messages:", response.data);
            setMessages([]);
          }
        } catch (error) {
          console.error("Error fetching messages:", error);
          setMessages([]);
        }
      })();
    }
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

  // Update the filteredChats calculation to maintain timestamp sorting
  const filteredChats = useMemo(() => {
    // First, convert any MongoDB dates to JS Date objects
    const normalizedChats = chats.map(chat => ({
      ...chat,
      timestamp: new Date(chat.timestamp)
    }));
    
    // Next, filter by search term
    const filtered = normalizedChats.filter(chat => 
      chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Finally, sort by timestamp
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [chats, searchTerm]);

  // Format message time - for individual messages
  const formatMessageTime = (timestamp) => {
    try {
      // Check if timestamp is valid, handle both createdAt and timestamp formats
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        console.error("Invalid timestamp:", timestamp);
        return '';
      }
      
      // Just return time in 12-hour format
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting message time:', error);
      return '';
    }
  };
  
  // Format date - for date separators
  const formatMessageDate = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return '';
      }
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Check if it's today
      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      }
      
      // Check if it's yesterday
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      
      // Otherwise, return the full date
      return date.toLocaleDateString([], {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting message date:', error);
      return '';
    }
  };
  
  // Format chat list timestamps
  const formatChatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return '';
      }
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Check if it's today
      if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // Check if it's yesterday
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      
      // If it's within the last week, show the day name
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);
      if (date >= oneWeekAgo) {
        return date.toLocaleDateString([], { weekday: 'short' });
      }
      
      // Otherwise, return the date
      return date.toLocaleDateString([], {
        month: 'numeric',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting chat time:', error);
      return '';
    }
  };

  // Format message timestamps with more detail for hover
  const formatFullMessageTime = (timestamp) => {
    try {
      // Check if timestamp is valid
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        console.error("Invalid timestamp:", timestamp);
        return "";
      }
      
      // Format the full date and time
      return date.toLocaleString([], {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error("Error formatting full date:", error);
      return "";
    }
  };

  // Listen for message delivery confirmations and update sent messages
  useEffect(() => {
    const handleMessageDelivery = (data) => {
      console.log("Message delivery confirmation received:", data);
      if (!data || !data.success) return;
      
      // Find any temporary message in our list and update it with the confirmed ID
      setMessages(prev => {
        const updatedMessages = prev.map(msg => {
          // If this is a temporary message (string ID that's a number), update it
          if (typeof msg._id === 'string' && !isNaN(Number(msg._id)) && data.messageId) {
            console.log("Updating sent message with server confirmation:", data.messageId);
            return {
              ...msg,
              _id: data.messageId,
              // Any other server-provided fields
            };
          }
          return msg;
        });
        
        return updatedMessages;
      });
    };
    
    socket.on("messageReceived", handleMessageDelivery);
    
    return () => {
      socket.off("messageReceived", handleMessageDelivery);
    };
  }, []);

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
            <ul className="divide-y divide-gray-100">
              {/* Use filteredChats directly - they're already sorted */}
              {filteredChats.map((chat) => (
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
                      className="w-12 h-12 rounded-full object-cover border border-gray-200"
                      onError={(e) => handleImageError(e, chat.name)}
                    />
                    {onlineUsers.some(
                      (u) => u.userId === chat.id || u.email === chat.email
                    ) && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-white"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-gray-800 truncate max-w-[70%]">
                        {chat.name}
                      </span>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatChatTime(chat.timestamp)}
                        </span>
                        {chat.unreadCount > 0 && (
                          <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center font-medium">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className={`text-sm mt-1 ${chat.unreadCount > 0 ? "font-medium text-gray-800" : "text-gray-500"} truncate`}>
                      {chat.lastMessage}
                    </p>
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
                  <div className="flex flex-col space-y-3">
                    {messages.length > 0 ? (
                      messages.map((message, index) => {
                        if (!message || !message.sender) {
                          console.error("Invalid message format:", message);
                          return null;
                        }

                        // Determine if current user is the sender
                        const isCurrentUser = message.sender.isCurrentUser || 
                                              (message.sender._id === currentUser.id);

                        // Skip messages not part of the selected chat
                        if (selectedChat && 
                            (isCurrentUser && (message.receiver !== selectedChat.id && message.receiver?._id !== selectedChat.id)) || 
                            (!isCurrentUser && (message.sender._id !== selectedChat.id && message.sender !== selectedChat.id))) {
                          return null;
                        }

                        // Get timestamp from wherever it exists in the message object
                        const messageTimestamp = message.createdAt || message.timestamp;

                        return (
                          <div
                            key={message._id || index}
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
                              <div className="text-xs text-gray-500 mt-1 text-right">
                                {formatMessageTime(messageTimestamp)}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex justify-center mt-4">
                        <p className="text-gray-500">No messages yet</p>
                      </div>
                    )}
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