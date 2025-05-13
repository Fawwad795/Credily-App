import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../utils/axios"; // Import the configured axios instance
import Nav from "../components/Nav";
import socket from "../utils/socket";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { format } from "date-fns";

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
  const fetchChatsList = async () => {
    try {
      const chatsResponse = await api.get("/messages/conversations");
      if (chatsResponse.data && chatsResponse.data.success) {
        setChats(chatsResponse.data.data);
      }
    } catch (error) {
      console.error("Error fetching chat list:", error);
    }
  };

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
      socket.emit("addUser", currentUser.email);
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
      socket.emit("addUser", currentUser.email);
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
      // Set up polling for messages instead of relying on socket
      interval = setInterval(() => {
        // Fetch messages using REST API
        fetchMessagesFromApi();
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fallbackMode, selectedChat, fetchMessagesFromApi]);

  // Listen for messages and online users
  useEffect(() => {
    // Listen for online users
    socket.on("getUsers", (users) => {
      console.log("Online users:", users);
      if (Array.isArray(users)) {
        setOnlineUsers(users);
      } else {
        console.error("Received invalid users data:", users);
        setOnlineUsers([]);
      }
    });

    // Listen for messages - support both formats
    socket.on("getMessage", (message) => {
      console.log("Got message (MySQL format):", message);
      if (!message) return;

      const formattedMessage = {
        id: message.messageId || Date.now().toString(),
        sender: {
          _id: message.senderEmail,
          isCurrentUser: false
        },
        content: message.text,
        timestamp: message.timestamp || new Date(),
        isRead: false,
      };

      // Add message to chat if selected, otherwise update unread count
      if (selectedChat && selectedChat.email === message.senderEmail) {
        setMessages((prev) => [...prev, formattedMessage]);
      } else {
        setUnreadCount((prev) => prev + 1);
        // Update chat unread count
        setChats((prevChats) => {
          // Check if chat exists
          const chatIndex = prevChats.findIndex(
            (chat) => chat.email === message.senderEmail
          );
          
          if (chatIndex >= 0) {
            // Update existing chat
            const updatedChats = [...prevChats];
            updatedChats[chatIndex] = {
              ...updatedChats[chatIndex],
              lastMessage: message.text,
              timestamp: message.timestamp || new Date(),
              unreadCount: (updatedChats[chatIndex].unreadCount || 0) + 1
            };
            return updatedChats;
          } else {
            // Fetch chats to get the new one
            fetchChatsList();
            return prevChats;
          }
        });
      }
    });

    // Listen for MongoDB format messages
    socket.on("newMessage", (message) => {
      if (!message) return;

      console.log("Received new message:", message);
      
      const formattedMessage = {
        id: message._id,
        content: message.content,
        timestamp: message.createdAt || new Date().toISOString(),
        isRead: message.isRead,
        sender: {
          _id: message.sender._id || message.sender,
          isCurrentUser: message.sender.isCurrentUser
        }
      };

      console.log("Formatted new message:", formattedMessage);

      if (selectedChat && selectedChat.id === formattedMessage.sender._id) {
        setMessages(prev => [...prev, formattedMessage]);
      }

      setChats(prevChats => {
        const chatIndex = prevChats.findIndex(
          chat => chat.id === formattedMessage.sender._id
        );
        
        if (chatIndex >= 0) {
          const updatedChats = [...prevChats];
          updatedChats[chatIndex] = {
            ...updatedChats[chatIndex],
            lastMessage: message.content,
            timestamp: message.createdAt || new Date().toISOString(),
            unreadCount:
              selectedChat && selectedChat.id === formattedMessage.sender._id
                ? 0
                : (updatedChats[chatIndex].unreadCount || 0) + 1,
          };
          return updatedChats;
        } else {
          fetchChatsList();
          return prevChats;
        }
      });
    });

    socket.on("addUser", (socketId, email) => {
      if (email && socketId) {
        const user = getUserBySocketId(socketId);
        console.log("User added to socket:", user);
      }
    });

    return () => {
      socket.off("getUsers");
      socket.off("getMessage");
      socket.off("newMessage");
      socket.off("addUser");
    };
  }, [selectedChat]);

  // Fetch chats - try MongoDB endpoint first, fall back to mock data
  useEffect(() => {
    fetchChatsList();
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
          const response = await api.get(`/messages/conversation/${selectedChat.id}`);
          if (response.data && response.data.success) {
            console.log("Fetched messages:", response.data.data.messages);
            const formattedMessages = response.data.data.messages.map(message => ({
              ...message,
              sender: {
                _id: message.sender._id,
                isCurrentUser: message.sender.isCurrentUser
              }
            }));
            setMessages(formattedMessages);
          }
        } catch (error) {
          console.error("Error fetching messages:", error);
        }
      };

      fetchMessages();

      // Mark chat as read when selected
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === selectedChat.id ? { ...chat, unreadCount: 0 } : chat
        )
      );
    }
  }, [selectedChat, currentUser.id]);

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
        isCurrentUser: true
      }
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageInput("");

    try {
      const response = await api.post("/messages", {
        receiverId: selectedChat.id,
        content: messageInput,
        messageType: "text",
      });

      if (response.data?.success) {
        const serverMessage = response.data.data;
        console.log("Server response for sent message:", serverMessage);
        
        setMessages(prev =>
          prev.map(msg =>
            msg.id === newMessage.id
              ? {
                  ...msg,
                  id: serverMessage._id,
                  sender: {
                    _id: serverMessage.sender._id || serverMessage.sender,
                    isCurrentUser: true
                  },
                  timestamp: serverMessage.createdAt || new Date().toISOString(),
                }
              : msg
          )
        );

        setChats(prevChats => {
          const updatedChats = prevChats.map(chat =>
            chat.id === selectedChat.id
              ? {
                  ...chat,
                  lastMessage: messageInput,
                  timestamp: new Date().toISOString(),
                }
              : chat
          );

          const chatIndex = updatedChats.findIndex(chat => chat.id === selectedChat.id);
          if (chatIndex > 0) {
            const chatToMove = updatedChats.splice(chatIndex, 1)[0];
            updatedChats.unshift(chatToMove);
          }

          return updatedChats;
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Handle selecting a chat
  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
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
      id: chat.user?._id || chat._id || chat.id,
      name: chat.user?.username || chat.user?.name || chat.name || "",
      email: chat.user?.email || chat.email || "",
      profilePicture: chat.user?.profilePicture || chat.profilePicture || "",
      lastMessage: chat.lastMessage?.content || chat.lastMessage || "",
      timestamp: chat.lastMessage?.createdAt || chat.timestamp || new Date(),
      unreadCount: chat.unreadCount || 0,
    }))
    .filter(
      (chat) =>
        chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Sort chats by timestamp (most recent first)
  const sortedChats = [...filteredChats].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );

  // Update the formatMessageTime function
  const formatMessageTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
   <div className="flex h-screen bg-gray-100">
  {/* Left Sidebar (Navbar) */}
  <Nav />

  {/* Main Content */}
  <div className="flex-1 flex flex-col ml-64 overflow-hidden">
    {/* Header */}
    <header className="grad text-white py-4 px-6 flex justify-between items-center shadow-md rounded-b-lg w-full sticky top-0 z-10">
      <h1 className="text-xl font-bold flex-1">Messages</h1>
      <span className="text-sm bg-red-500 text-white px-3 py-1 rounded-full ml-4">
        {unreadCount} Unread
      </span>
    </header>

    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/3 bg-gray-50 shadow-md rounded-l-lg overflow-y-auto">
        <h2 className="text-xl font-bold p-4">Chats</h2>
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
                    {new Date(chat.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">
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
                    timestamp: message.timestamp
                  });
                  
                  const isCurrentUser = message.sender.isCurrentUser;
                  const formattedTime = formatMessageTime(message.timestamp);
                  
                  return (
                    <div
                      key={message.id}
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
                        <p className="text-sm break-words">{message.content}</p>
                        <p className={`text-xs mt-1 ${isCurrentUser ? "text-black" : "text-black"}`}>
                          {formattedTime}
                        </p>
                      </div>
                    </div>
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
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
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
            <p className="text-gray-500">Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  </div>
</div>
  );
}
export default MessagingPage;