import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Nav from "../components/Nav";
import socket from "../utils/socket";

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

  // Helper function to get socket user by socket ID
  const getUserBySocketId = (socketId) => {
    return onlineUsers.find((user) => user.socketId === socketId);
  };

  // Set up socket connection status
  useEffect(() => {
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
        const response = await axios.get(
          `/api/messages/conversation/${selectedChat.id}`
        );
        if (response.data && response.data.success) {
          setMessages(
            response.data.data.messages.map((msg) => ({
              id: msg._id,
              sender: msg.sender._id || msg.sender,
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
      const unreadResponse = await axios.get("/api/messages/unread-count");
      if (unreadResponse.data && unreadResponse.data.success) {
        setUnreadCount(unreadResponse.data.data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching unread count in fallback mode:", error);
    }

    // Fetch latest chats too
    try {
      const chatsResponse = await axios.get("/api/messages/conversations");
      if (chatsResponse.data && chatsResponse.data.success) {
        setChats(chatsResponse.data.data);
      }
    } catch (error) {
      console.error("Error fetching chat list in fallback mode:", error);
      // Add mock data for testing
      setChats([
        {
          id: "1",
          name: "John Doe",
          email: "john@example.com",
          profilePicture: "https://randomuser.me/api/portraits/men/1.jpg",
          lastMessage: "Hey there! How's it going?",
          timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
          unreadCount: 2,
        },
        {
          id: "2",
          name: "Jane Smith",
          email: "jane@example.com",
          profilePicture: "https://randomuser.me/api/portraits/women/1.jpg",
          lastMessage: "Are we still meeting tomorrow?",
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
          unreadCount: 0,
        },
      ]);
    }
  }, [selectedChat]);

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
        sender: message.senderEmail,
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
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.email === message.senderEmail
              ? { ...chat, unreadCount: (chat.unreadCount || 0) + 1 }
              : chat
          )
        );
      }
    });

    // Listen for MongoDB format messages
    socket.on("newMessage", (message) => {
      console.log("Got message (MongoDB format):", message);
      if (!message) return;

      const formattedMessage = {
        id: message._id || Date.now().toString(),
        sender: message.sender?._id || message.sender,
        content: message.content,
        timestamp: message.createdAt || new Date(),
        isRead: message.isRead || false,
      };

      // Add message to chat if selected, otherwise update unread count
      if (
        selectedChat &&
        (selectedChat.id === message.sender._id ||
          selectedChat.id === message.sender)
      ) {
        setMessages((prev) => [...prev, formattedMessage]);
      } else {
        setUnreadCount((prev) => prev + 1);
        // Update chat unread count using a more reliable check
        setChats((prevChats) =>
          prevChats.map((chat) => {
            const senderId = message.sender?._id || message.sender;
            return chat.id === senderId
              ? { ...chat, unreadCount: (chat.unreadCount || 0) + 1 }
              : chat;
          })
        );
      }
    });

    return () => {
      socket.off("getUsers");
      socket.off("getMessage");
      socket.off("newMessage");
    };
  }, [selectedChat]);

  // Fetch chats - try MongoDB endpoint first, fall back to mock data
  useEffect(() => {
    const fetchChats = async () => {
      try {
        // Use your actual endpoint - check your backend routes
        const response = await axios.get("/api/messages/conversations");
        if (response.data && response.data.success) {
          setChats(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
        // Mock data will still work as fallback
      }
    };

    fetchChats();
  }, []);

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        // Use your actual endpoint
        const response = await axios.get("/api/messages/unread-count");
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
          const response = await axios.get(
            `/api/messages/conversation/${selectedChat.id}`
          );
          if (response.data && response.data.success) {
            setMessages(
              response.data.data.messages.map((msg) => ({
                id: msg._id,
                sender: msg.sender._id,
                content: msg.content,
                timestamp: msg.createdAt,
                isRead: msg.isRead,
              }))
            );
          }
        } catch (error) {
          console.error("Error fetching messages:", error);
          // Set mock messages for testing
          setMessages([
            {
              id: "msg1",
              sender: selectedChat.id,
              content: "Hello there!",
              timestamp: new Date(Date.now() - 3600000),
              isRead: true,
            },
            {
              id: "msg2",
              sender: currentUser.id,
              content: "Hi! How are you?",
              timestamp: new Date(Date.now() - 1800000),
              isRead: true,
            },
          ]);
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

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat) return;

    try {
      // First try MongoDB API
      const response = await axios.post("/api/messages", {
        receiverId: selectedChat.id,
        content: messageInput,
        messageType: "text",
      });

      if (response.data && response.data.success) {
        console.log("Message sent successfully via MongoDB API");
      }
    } catch (error) {
      console.error("Error sending message via API:", error);

      // Fall back to direct socket.io (MySQL style)
      socket.emit("sendMessage", {
        senderEmail: currentUser.email,
        receiverEmail: selectedChat.email,
        text: messageInput,
        timestamp: new Date(),
      });
    }

    // Add message to UI immediately
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: currentUser.id,
        content: messageInput,
        timestamp: new Date(),
        isRead: false,
      },
    ]);

    // Clear input
    setMessageInput("");
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

  // Socket event handling for user connection
  socket.on("addUser", (socketId, email) => {
    if (email && socketId) {
      const user = getUserBySocketId(socketId);
      console.log("User added to socket:", user);
    }
  });

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar (Navbar) */}
      <Nav />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Header */}
        <header className="grad text-white py-4 px-6 flex justify-between items-center shadow-md rounded-b-lg">
          <h1 className="text-xl font-bold">Messages</h1>
          <span className="text-sm bg-red-500 text-white px-3 py-1 rounded-full">
            {unreadCount} Unread
          </span>
          <div className="socket-status">
            {isConnected ? (
              <span className="bg-green-500 text-white px-2 py-1 rounded-md text-xs">
                Real-time connected
              </span>
            ) : (
              <span className="bg-red-500 text-white px-2 py-1 rounded-md text-xs">
                Real-time disconnected
              </span>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1">
          {/* Sidebar */}
          <div className="w-1/3 bg-gray-50 overflow-y-auto shadow-md rounded-l-lg">
            <h2 className="text-xl font-bold p-4">Chats</h2>
            <ul>
              {chats.map((chat) => (
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
          <div className="flex-1 flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 bg-gray-50 text-gray-800 shadow-md">
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
                      <p className="text-xs text-gray-500">
                        {onlineUsers.some(
                          (u) =>
                            u.userId === selectedChat.id ||
                            u.email === selectedChat.email
                        )
                          ? "Online"
                          : "Offline"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`mb-4 flex ${
                        message.sender === currentUser.id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs p-3 rounded-lg shadow-sm ${
                          message.sender === currentUser.id
                            ? "bg-blue-500 text-white"
                            : "bg-white text-gray-800"
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 bg-white flex items-center shadow-md">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="ml-4 bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition duration-300"
                  >
                    Send
                  </button>
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
