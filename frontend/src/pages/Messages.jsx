import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import api from "../utils/axios"; // Import the configured axios instance
import Nav from "../components/Nav";
import socket from "../utils/socket";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { useTheme } from "../components/Nav"; // Import the useTheme hook

const MessagingPage = () => {
  const { darkMode } = useTheme(); // Use the theme context
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // Helper function to get socket user by socket ID (commented out as unused)
  // const getUserBySocketId = (socketId) => {
  //   return onlineUsers.find((user) => user.socketId === socketId);
  // };

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

  // Function to fetch chats list - with sender ID and read status for ticks
  const fetchChatsList = useCallback(async () => {
    try {
      // Use no-cache to ensure fresh data
      const chatsResponse = await api.get("/messages/conversations", {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (chatsResponse.data && chatsResponse.data.success) {
        // Process and normalize the chat data
        const formattedChats = chatsResponse.data.data.map(chat => {
          // Extract key data from the chat object
          const id = chat._id?.toString() || chat.id?.toString() || "";
          const name = chat.user?.username || chat.name || "";
          const email = chat.user?.email || chat.email || "";
          const profilePicture = chat.user?.profilePicture || chat.profilePicture || "";
          
          // Process last message data - for read status
          let lastMessage = "";
          let lastMessageSenderId = "";
          let lastMessageRead = false;
          
          if (chat.lastMessage) {
            if (typeof chat.lastMessage === 'string') {
              lastMessage = chat.lastMessage;
            } else {
              lastMessage = chat.lastMessage.content || "";
              lastMessageSenderId = 
                typeof chat.lastMessage.sender === 'object' 
                  ? chat.lastMessage.sender._id 
                  : chat.lastMessage.sender;
              lastMessageRead = chat.lastMessage.isRead || false;
            }
          }
          
          // Get timestamp
          let timestamp = new Date();
          if (chat.lastMessage?.createdAt) {
            timestamp = new Date(chat.lastMessage.createdAt);
          } else if (chat.timestamp) {
            timestamp = new Date(chat.timestamp);
          }
          
          // Count unread messages
          const unreadCount = chat.unreadCount || 0;
          
          // Fast chat object creation
          return {
            id,
            name,
            email,
            profilePicture,
            lastMessage,
            lastMessageSenderId,
            lastMessageRead,
            timestamp,
            unreadCount
          };
        });
        
        // Sort chats by timestamp (most recent first)
        formattedChats.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Fast update - don't trigger unnecessary re-renders
        setChats(prevChats => {
          // Check if there's any actual difference
          let hasChanges = false;
          
          if (prevChats.length !== formattedChats.length) {
            hasChanges = true;
          } else {
            // Check if any key fields have changed
            for (let i = 0; i < formattedChats.length; i++) {
              const newChat = formattedChats[i];
              const oldChat = prevChats[i];
              
              if (newChat.id !== oldChat.id || 
                  newChat.lastMessage !== oldChat.lastMessage ||
                  newChat.unreadCount !== oldChat.unreadCount ||
                  newChat.lastMessageRead !== oldChat.lastMessageRead) {
                hasChanges = true;
                break;
              }
            }
          }
          
          // Only update state if there are actual changes
          return hasChanges ? formattedChats : prevChats;
        });
      }
    } catch (error) {
      console.error("Error fetching chat list:", error);
    }
  }, []);

  // Socket event for listening to other users' online status
  useEffect(() => {
    // Set up user status update listener
    socket.on("getUsers", (users) => {
      if (!Array.isArray(users)) return;
      setOnlineUsers(users);
    });

    // Listen for new messages
    const handleNewMessage = (message) => {
      if (!message) return;

      // Fast path - skip validation to reduce processing time
      if (!message.sender || !message.content) return;

      // Extract sender and receiver IDs - using fastest method
      const senderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
      const receiverId = typeof message.receiver === 'object' ? message.receiver._id : message.receiver;
      
      // Fast check if current user is the sender
      const isSentByMe = senderId === currentUser.id;
      
      // Determine the other user's ID (the one we're chatting with)
      const otherUserId = isSentByMe ? receiverId : senderId;
      
      // Format the message with minimal processing
      const formattedMessage = {
        _id: message._id || Date.now().toString(),
        content: message.content,
        createdAt: message.createdAt || new Date().toISOString(),
        isRead: message.isRead || false,
        sender: {
          _id: senderId,
          isCurrentUser: isSentByMe
        },
        receiver: receiverId
      };

      // Fast path - add to current chat immediately if it belongs there
      if (selectedChat && selectedChat.id === otherUserId) {
        // Only check for duplicates by ID if we have one
        if (formattedMessage._id) {
          setMessages(prev => {
            // Skip if already exists
            if (prev.some(m => m._id === formattedMessage._id)) {
              return prev;
            }
            // Add new message and trigger immediate render
            return [...prev, formattedMessage];
          });
        } else {
          // No ID to check, just add it
          setMessages(prev => [...prev, formattedMessage]);
        }
        
        // Mark as read immediately for received messages
        if (!isSentByMe && formattedMessage._id) {
          socket.emit("markAsRead", {
            messageId: formattedMessage._id,
            chatId: selectedChat.id
          });
        }
      } 
      // Handle unread count for messages not in current view
      else if (!isSentByMe) {
        // Increment unread count immediately
        setUnreadCount(prev => prev + 1);
      }

      // Update chat list with new message and read status
      updateChatWithMessage(message, otherUserId, isSentByMe);
    };
    
    // Listen for messages and read status events
    socket.on("newMessage", handleNewMessage);
    
    // Handle message read receipts - comprehensive approach
    const handleMessageRead = (data) => {
      console.log("Message read status update received:", data);
      if (!data || !data.messageId) return;
      
      // Update in messages array - handle both string and ObjectId formats
      setMessages(prev => 
        prev.map(msg => {
          // Check for match in any format (string or ObjectId)
          const isMatch = 
            msg._id === data.messageId || 
            msg._id === data.messageId.toString() ||
            (msg._id && msg._id.toString) && msg._id.toString() === data.messageId.toString();
          
          if (isMatch) {
            console.log("Updating message read status:", msg._id);
            return { ...msg, isRead: true };
          }
          return msg;
        })
      );
      
      // Update in chat list - handle both string and ObjectId formats
      if (data.chatId) {
        setChats(prev => 
          prev.map(chat => {
            // Check for match in any format (string or ObjectId)
            const isChatMatch = 
              chat.id === data.chatId || 
              chat.id === data.chatId.toString() ||
              (chat.id && chat.id.toString) && chat.id.toString() === data.chatId.toString();
            
            // Only update if it's a message sent by current user
            if (isChatMatch && chat.lastMessageSenderId === currentUser.id) {
              console.log("Updating chat read status:", chat.id);
              // Also store this status in localStorage for persistence
              localStorage.setItem(`chat_${chat.id}_read`, 'true');
              return { ...chat, lastMessageRead: true };
            }
            return chat;
          })
        );
      }
    };
    
    // Listen for both individual message read events and batch updates
    socket.on("messageRead", handleMessageRead);
    socket.on("messagesRead", (data) => {
      if (!data || !data.chatId) return;
      
      // Update chat list to show messages as read
      setChats(prev => 
        prev.map(chat => 
          (chat.id === data.chatId || chat.id === data.chatId.toString()) && 
          chat.lastMessageSenderId === currentUser.id
            ? { ...chat, lastMessageRead: true }
            : chat
        )
      );
      
      // If there are specific message IDs, update those too
      if (data.messageIds && Array.isArray(data.messageIds)) {
        setMessages(prev => 
          prev.map(msg => 
            data.messageIds.includes(msg._id) || 
            data.messageIds.includes(msg._id.toString())
              ? { ...msg, isRead: true }
              : msg
          )
        );
      }
    });
    
    // Cleanup
    return () => {
      socket.off("getUsers");
      socket.off("newMessage", handleNewMessage);
      socket.off("messageRead", handleMessageRead);
      socket.off("messagesRead");
    };
  }, [currentUser.id, selectedChat]);

  // Quick update of chat list when new message is received
  const updateChatWithMessage = (message, otherUserId, isSentByMe) => {
    setChats(prevChats => {
      // Find chat if exists
      const chatIndex = prevChats.findIndex(chat => chat.id === otherUserId);
      
      // Create new chats array
      const updatedChats = [...prevChats];

      // Extract sender ID for read status tick
      const senderId = 
        typeof message.sender === 'object' 
          ? message.sender._id 
          : message.sender;
      
      if (chatIndex >= 0) {
        // Fast update of existing chat
        const existingChat = updatedChats[chatIndex];
        const updatedChat = {
          ...existingChat,
          lastMessage: message.content,
          lastMessageSenderId: senderId,
          lastMessageRead: message.isRead || false,
          timestamp: new Date().toISOString(),
          unreadCount: !isSentByMe && (!selectedChat || selectedChat.id !== otherUserId)
            ? (existingChat.unreadCount || 0) + 1
            : existingChat.unreadCount || 0
        };
        
        // Remove and add to beginning in one operation
        updatedChats.splice(chatIndex, 1);
        updatedChats.unshift(updatedChat);
      } else {
        // Fast creation of new chat with minimal processing
        const senderInfo = typeof message.sender === 'object' ? message.sender : {};
        const receiverInfo = typeof message.receiver === 'object' ? message.receiver : {};
        const chatInfo = !isSentByMe ? senderInfo : receiverInfo;
        
        // Create with only essential fields
        updatedChats.unshift({
          id: otherUserId,
          name: chatInfo.username || "User",
          email: chatInfo.email || "",
          profilePicture: chatInfo.profilePicture || "",
          lastMessage: message.content,
          lastMessageSenderId: senderId,
          lastMessageRead: message.isRead || false,
          timestamp: new Date().toISOString(),
          unreadCount: !isSentByMe ? 1 : 0
        });
      }
      
      return updatedChats;
    });
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

  // Drastically reduce delays in fetching
  useEffect(() => {
    let interval; // Declare variable with proper scope
    
    if (fallbackMode) {
      // Set up polling for messages and chats instead of relying on socket
      interval = setInterval(() => {
        // Fetch messages using REST API if a chat is selected
        if (selectedChat) {
          fetchMessagesFromApi();
        }
        
        // Always fetch latest chats to keep the list updated
        fetchChatsList();
      }, 1000); // Reduce from 3000 to 1000ms
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fallbackMode, selectedChat, fetchMessagesFromApi, fetchChatsList]);

  // Modify the useEffect that fetches the chat list to use proper interval variable
  useEffect(() => {
    // Initial fetch
    fetchChatsList();
    
    // Set up polling for chat list at a shorter interval for better sync
    const chatListInterval = setInterval(() => {
      fetchChatsList();
    }, 3000); // Original polling interval
    
    return () => {
      if (chatListInterval) clearInterval(chatListInterval);
    };
  }, [fetchChatsList]);

  // Keep messages refreshed with proper interval handling
  useEffect(() => {
    // Only set up refresh if a chat is selected
    if (!selectedChat) return;
    
    console.log("Setting up message refresh for chat:", selectedChat.id);
    
    // Initial fetch - immediate
    fetchMessages(selectedChat.id);
    
    // Set up an interval to periodically check for new messages - more frequently for better sync
    const messageRefreshInterval = setInterval(() => {
      fetchMessages(selectedChat.id);
    }, 2000); // Original polling interval
    
    // Clean up
    return () => {
      if (messageRefreshInterval) clearInterval(messageRefreshInterval);
    };
  }, [selectedChat?.id]);

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

  // Optimize message fetching for speed and reduced delay
  const fetchMessages = async (chatId) => {
    if (!chatId) return;
    
    try {
      // Use no-cache header to ensure fresh data each time
      const response = await api.get(`/messages/conversation/${chatId}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.data && response.data.success) {
        console.log("Successfully fetched messages:", response.data.data.messages.length);
        
        // Set messages from API response - immediately
        setMessages(response.data.data.messages || []);
        
        // Also immediately update chat list to reflect latest status - this ensures sync
        setChats(prevChats => {
          let chatUpdated = false;
          
          const updatedChats = prevChats.map(chat => {
            if (chat.id === chatId) {
              chatUpdated = true;
              return { 
                ...chat, 
                unreadCount: 0,
                // Update these only if the message is from the current user
                ...(chat.lastMessageSenderId === currentUser.id ? {
                  lastMessageRead: true // Always mark current user's messages as read
                } : {})
              };
            }
            return chat;
          });
          
          // If no chat was updated, it's probably because we haven't fetched the chat list yet
          // No need to trigger re-render
          return chatUpdated ? updatedChats : prevChats;
        });
        
        // Calculate new total unread count - immediately update UI
        setUnreadCount(prevCount => {
          const currentChat = chats.find(c => c.id === chatId);
          const chatUnreadCount = currentChat?.unreadCount || 0;
          return Math.max(0, prevCount - chatUnreadCount);
        });
        
        // Mark messages as read using socket for remote sync
        const unreadMessages = response.data.data.messages.filter(
          msg => !msg.isRead && msg.sender._id !== currentUser.id
        );
        
        if (unreadMessages.length > 0 && socket.connected) {
          try {
            // Use a single batch update for better performance
            socket.emit("markAllAsRead", {
              chatId: chatId,
              messageIds: unreadMessages.map(msg => msg._id)
            });
          } catch (socketError) {
            console.error("Socket error marking messages read:", socketError);
            
            // Fall back to API if socket fails
            try {
              await api.post("/messages/mark-read", {
                chatId: chatId,
                messageIds: unreadMessages.map(msg => msg._id)
              });
            } catch (apiError) {
              console.error("API error marking messages read:", apiError);
            }
          }
        }
      } else {
        console.error("Failed to fetch messages:", response.data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Handle sending a message - optimized for better performance
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat) return;

    // Create unique message ID for optimistic update
    const tempMessageId = Date.now().toString();

    // Format message with proper structure
    const newMessage = {
      _id: tempMessageId,
      content: messageInput,
      createdAt: new Date().toISOString(),
      isRead: false, // Ensure this starts as false
      sender: {
        _id: currentUser.id,
        isCurrentUser: true
      },
      receiver: selectedChat.id
    };

    // Save message content before clearing
    const messageSent = messageInput;

    // Add to UI immediately (optimistic update)
    setMessages(prev => [...prev, newMessage]);
    
    // Clear input quickly for better UX
    setMessageInput("");
    
    // Scroll to bottom
    scrollToBottom();

    // Update permanent storage to ensure tick visibility
    updatePermanentReadStatus(selectedChat.id, false);

    try {
      // Send to API
      const response = await api.post("/messages", {
        receiverId: selectedChat.id,
        content: messageSent,
      });

      if (response.data && response.data.success) {
        const serverMessage = response.data.data;
        
        // Update local message with server ID and timestamp
        setMessages(prev => 
          prev.map(msg => 
            msg._id === tempMessageId 
              ? { 
                  ...msg, 
                  _id: serverMessage._id,
                  createdAt: serverMessage.createdAt,
                  isRead: serverMessage.isRead || false
                } 
              : msg
          )
        );
        
        // Make sure permanent storage is updated
        updatePermanentReadStatus(selectedChat.id, serverMessage.isRead || false);
        
        // Update chats list with latest message
        setChats(prev => {
          const existingChatIndex = prev.findIndex(c => c.id === selectedChat.id);
          
          if (existingChatIndex >= 0) {
            // Update existing chat with new message
            const updatedChats = [...prev];
            const chatToUpdate = {...updatedChats[existingChatIndex]};
            
            // Update chat properties
            chatToUpdate.lastMessage = messageSent;
            chatToUpdate.lastMessageSenderId = currentUser.id;
            chatToUpdate.lastMessageRead = serverMessage.isRead || false;
            chatToUpdate.timestamp = new Date().toISOString();
            
            // Make sure permanent storage reflects this status
            updatePermanentReadStatus(selectedChat.id, chatToUpdate.lastMessageRead);
            
            // Remove from current position
            updatedChats.splice(existingChatIndex, 1);
            // Move to top
            updatedChats.unshift(chatToUpdate);
            
            return updatedChats;
          } else {
            // Create new chat (this shouldn't normally happen)
            const newChat = {
              id: selectedChat.id,
              name: selectedChat.name,
              email: selectedChat.email,
              profilePicture: selectedChat.profilePicture,
              lastMessage: messageSent,
              lastMessageSenderId: currentUser.id,
              lastMessageRead: false, // Start as unread
              timestamp: new Date().toISOString(),
              unreadCount: 0
            };
            
            // Update permanent storage
            updatePermanentReadStatus(selectedChat.id, false);
            
            return [newChat, ...prev];
          }
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Handle UI error (keep the message but mark it as failed)
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempMessageId 
            ? { ...msg, error: true } 
            : msg
        )
      );
    }
  };

  // Optimize handleSelectChat for even faster performance
  const handleSelectChat = (chat) => {
    if (selectedChat?.id === chat.id) return; // Skip if already selected
    
    // Store current chat's lastMessageRead status before switching
    if (selectedChat) {
      const currentChatIndex = chats.findIndex(c => c.id === selectedChat.id);
      if (currentChatIndex >= 0) {
        const currentChat = chats[currentChatIndex];
        // Remember this chat's read status if the current user sent the last message
        if (currentChat.lastMessageSenderId === currentUser.id) {
          console.log(`Saving chat ${currentChat.id} read status: ${currentChat.lastMessageRead}`);
          localStorage.setItem(`chat_${currentChat.id}_read`, String(currentChat.lastMessageRead));
        }
      }
    }
    
    // Clear messages immediately
    setMessages([]);
    
    // Immediately update UI to show chat as read - do this first for instant feedback
    const prevUnreadCount = chat.unreadCount || 0;
    
    // Update UI first, then do other operations
    setChats(prevChats => {
      const updatedChats = prevChats.map(c => {
        if (c.id === chat.id) {
          // Update the selected chat, resetting unread count
          return { ...c, unreadCount: 0 };
        } else if (c.id === selectedChat?.id && c.lastMessageSenderId === currentUser.id) {
          // For the previous chat, ensure read status is preserved if current user sent last message
          const savedReadStatus = localStorage.getItem(`chat_${c.id}_read`) === 'true';
          return { ...c, lastMessageRead: savedReadStatus };
        }
        return c;
      });
      return updatedChats;
    });
    
    // Set selected chat right after UI update
    setSelectedChat(chat);
    
    // Update total unread count
    setUnreadCount(prevCount => Math.max(0, prevCount - prevUnreadCount));
    
    // Fetch messages after UI is updated
    if (chat.id) {
      requestAnimationFrame(() => {
        fetchMessages(chat.id);
      });
    }
    setIsChatOpen(true);
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

  // Format message time - optimized for performance
  const formatMessageTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      
      // Use the fastest time formatting method
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return '';
    }
  };
  
  // Format date - for date separators (commented out as unused)
  // const formatMessageDate = (timestamp) => {
  //   try {
  //     const date = new Date(timestamp);
  //     if (isNaN(date.getTime())) {
  //       return '';
  //     }
  //     
  //     const today = new Date();
  //     const yesterday = new Date(today);
  //     yesterday.setDate(yesterday.getDate() - 1);
  //     
  //     // Check if it's today
  //     if (date.toDateString() === today.toDateString()) {
  //       return 'Today';
  //     }
  //     
  //     // Check if it's yesterday
  //     if (date.toDateString() === yesterday.toDateString()) {
  //       return 'Yesterday';
  //     }
  //     
  //     // Otherwise, return the full date
  //     return date.toLocaleDateString([], {
  //       weekday: 'long',
  //       year: 'numeric',
  //       month: 'long',
  //       day: 'numeric'
  //     });
  //   } catch (error) {
  //     console.error('Error formatting message date:', error);
  //     return '';
  //   }
  // };
  
  // Format chat list timestamps - optimized
  const formatChatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Use date objects for comparison instead of strings
      const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      // Optimize conditionals for speed
      if (messageDate.getTime() === today.getTime()) {
        return date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }
      
      if (messageDate.getTime() === yesterday.getTime()) {
        return 'Yesterday';
      }
      
      // Check if within a week
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 6);
      
      if (date >= weekAgo) {
        // Use cached day names for speed
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[date.getDay()];
      }
      
      // Otherwise just return month/day
      return `${date.getMonth() + 1}/${date.getDate()}`;
    } catch (error) {
      return '';
    }
  };

  // Format message timestamps with more detail for hover (commented out as unused)
  // const formatFullMessageTime = (timestamp) => {
  //   try {
  //     // Check if timestamp is valid
  //     const date = new Date(timestamp);
  //     if (isNaN(date.getTime())) {
  //       console.error("Invalid timestamp:", timestamp);
  //       return "";
  //     }
  //     
  //     // Format the full date and time
  //     return date.toLocaleString([], {
  //       weekday: 'long',
  //       year: 'numeric',
  //       month: 'long',
  //       day: 'numeric',
  //       hour: '2-digit',
  //       minute: '2-digit'
  //     });
  //   } catch (error) {
  //     console.error("Error formatting full date:", error);
  //     return "";
  //   }
  // };

  // Keep track of read status in the message delivery handler
  useEffect(() => {
    const handleMessageDelivery = (data) => {
      console.log("Message delivery confirmation received:", data);
      if (!data || !data.success) return;
      
      // If there's a specific messageId in the response, use that to update messages
      if (data.messageId) {
        setMessages(prev => {
          const updatedMessages = prev.map(msg => {
            // Find temporary messages by checking if ID is a timestamp (numeric string)
            const isTemporaryMessage = typeof msg._id === 'string' && !isNaN(Number(msg._id));
            if (isTemporaryMessage) {
              console.log("Updating temporary message with server ID:", data.messageId);
              return {
                ...msg,
                _id: data.messageId,
                // Ensure read status is preserved
                isRead: msg.isRead || false
              };
            }
            return msg;
          });
          
          return updatedMessages;
        });
        
        // Also update the chat list when a message is delivered
        setChats(prev => 
          prev.map(chat => {
            if (chat.id === selectedChat?.id) {
              const updatedChat = { 
                ...chat,
                lastMessageId: data.messageId,
                // Ensure read status is preserved
                lastMessageRead: chat.lastMessageRead || false
              };
              
              // Persist read status to localStorage
              if (updatedChat.lastMessageSenderId === currentUser.id) {
                localStorage.setItem(`chat_${chat.id}_read`, updatedChat.lastMessageRead);
              }
              
              return updatedChat;
            }
            return chat;
          })
        );
      }
    };
    
    socket.on("messageReceived", handleMessageDelivery);
    
    return () => {
      socket.off("messageReceived", handleMessageDelivery);
    };
  }, [selectedChat, currentUser.id]);

  // Function to find and track the last message sent by the current user in each chat
  const trackLastSentMessageStatus = useCallback(() => {
    // Create a map to store last messages by chat ID
    const lastSentMessages = {};
    
    // Process each chat
    chats.forEach(chat => {
      if (chat.lastMessageSenderId === currentUser.id) {
        // Store the read status of this chat
        lastSentMessages[chat.id] = chat.lastMessageRead;
      }
    });
    
    // Store this information in localStorage for persistence
    localStorage.setItem('lastSentMessages', JSON.stringify(lastSentMessages));
  }, [chats, currentUser.id]);
  
  // Run this effect whenever chats change
  useEffect(() => {
    trackLastSentMessageStatus();
  }, [chats, trackLastSentMessageStatus]);
  
  // Modified useEffect to ensure ticks never disappear by directly monitoring chat list
  useEffect(() => {
    // This function guarantees ticks always show properly
    const enforceTickVisibility = () => {
      try {
        // Get stored last message statuses
        const storedStatusesString = localStorage.getItem('lastSentMessages');
        const storedStatuses = storedStatusesString ? JSON.parse(storedStatusesString) : {};
        
        // Update chat list if needed
        setChats(prevChats => {
          // Skip if no chats
          if (!prevChats || prevChats.length === 0) {
            return prevChats;
          }
          
          let needsUpdate = false;
          
          // Create updated chats
          const updatedChats = prevChats.map(chat => {
            if (!chat || !chat.id) return chat; // Skip invalid chats
            
            // 1. First, check if this is a chat where the current user sent the last message
            if (chat.lastMessageSenderId === currentUser.id) {
              // Already has correct sender ID, just make sure read status is preserved
              if (chat.id in storedStatuses && storedStatuses[chat.id] !== chat.lastMessageRead) {
                needsUpdate = true;
                return { ...chat, lastMessageRead: storedStatuses[chat.id] };
              }
            } 
            // 2. If the last message wasn't sent by current user, check if we previously had sent the last message
            else if (chat.id in storedStatuses) {
              // The chat used to have a message from us as the last message
              // We should display a tick based on that message's read status
              const storedReadStatus = storedStatuses[chat.id];
              
              // Instead of changing the last message sender ID, we'll add a flag to show a tick
              needsUpdate = true;
              return { 
                ...chat, 
                // This will be used in rendering to decide whether to show a tick
                showLastSentTick: true,
                lastSentMessageRead: storedReadStatus 
              };
            }
            
            return chat;
          });
          
          return needsUpdate ? updatedChats : prevChats;
        });
      } catch (error) {
        console.error("Error in enforceTickVisibility:", error);
      }
    };
    
    // Run immediately
    enforceTickVisibility();
    
    // Then set up interval to enforce (less frequent to avoid performance issues)
    const tickInterval = setInterval(enforceTickVisibility, 2000);
    
    return () => {
      if (tickInterval) clearInterval(tickInterval);
    };
  }, [currentUser.id]);

  // Use fallback mode if socket connection fails - with fixed interval declaration
  useEffect(() => {
    let fallbackInterval = null; // Declare variable in this scope
    
    if (fallbackMode) {
      // Set up polling for messages and chats instead of relying on socket
      fallbackInterval = setInterval(() => {
        // Fetch messages using REST API if a chat is selected
        if (selectedChat) {
          fetchMessagesFromApi();
        }
        
        // Always fetch latest chats to keep the list updated
        fetchChatsList();
      }, 3000); // Original polling interval
    }
    
    return () => {
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [fallbackMode, selectedChat, fetchMessagesFromApi, fetchChatsList]);

  // Directly update localStorage whenever a message is sent or read
  useEffect(() => {
    // Listen for message read status updates
    socket.on("messageRead", (data) => {
      if (!data || !data.messageId) return;
      
      console.log("Message read status update received:", data);
      
      // Update in messages array
      setMessages(prev => 
        prev.map(msg => {
          if (msg._id === data.messageId) {
            return { ...msg, isRead: true };
          }
          return msg;
        })
      );
      
      // Update in chat list
      if (data.chatId) {
        setChats(prev => 
          prev.map(chat => {
            if (chat.id === data.chatId && chat.lastMessageSenderId === currentUser.id) {
              // Store the read status permanently in localStorage
              const permanentStorage = JSON.parse(localStorage.getItem('messageReadStatus') || '{}');
              permanentStorage[chat.id] = true;
              localStorage.setItem('messageReadStatus', JSON.stringify(permanentStorage));
              
              console.log(`Permanently stored read status for chat ${chat.id}: true`);
              
              return { ...chat, lastMessageRead: true };
            }
            return chat;
          })
        );
      }
    });
    
    return () => {
      socket.off("messageRead");
    };
  }, [currentUser.id]);

  // Function to make sure the tick status persists always
  const ensureTickVisibility = useCallback(() => {
    setChats(prev => {
      const updatedChats = prev.map(chat => {
        // First check if we sent the last message
        if (chat.lastMessageSenderId === currentUser.id) {
          // Get permanent storage
          const permanentStorage = JSON.parse(localStorage.getItem('messageReadStatus') || '{}');
          // If we have stored a read status for this chat, use it
          if (chat.id in permanentStorage) {
            return {
              ...chat,
              lastMessageRead: permanentStorage[chat.id]
            };
          }
        }
        return chat;
      });
      
      return updatedChats;
    });
  }, [currentUser.id]);

  // Run frequently to ensure ticks never disappear
  useEffect(() => {
    ensureTickVisibility();
    
    const tickInterval = setInterval(ensureTickVisibility, 500);
    
    return () => {
      clearInterval(tickInterval);
    };
  }, [ensureTickVisibility]);

  // Function to check if chat has a message from current user
  const hasSentMessage = useCallback((chatId) => {
    try {
      const permanentStorage = JSON.parse(localStorage.getItem('messageReadStatus') || '{}');
      return chatId in permanentStorage;
    } catch (error) {
      console.error("Error checking sent message:", error);
      return false;
    }
  }, []);
  
  // Function to get the read status of a message sent by current user
  const getMessageReadStatus = useCallback((chatId) => {
    try {
      const permanentStorage = JSON.parse(localStorage.getItem('messageReadStatus') || '{}');
      return permanentStorage[chatId] || false;
    } catch (error) {
      console.error("Error getting message read status:", error);
      return false;
    }
  }, []);

  // Function to update a chat's read status in permanent storage
  const updatePermanentReadStatus = useCallback((chatId, isRead) => {
    try {
      const permanentStorage = JSON.parse(localStorage.getItem('messageReadStatus') || '{}');
      permanentStorage[chatId] = isRead;
      localStorage.setItem('messageReadStatus', JSON.stringify(permanentStorage));
      console.log(`Updated permanent read status for chat ${chatId}: ${isRead}`);
    } catch (error) {
      console.error("Error updating permanent read status:", error);
    }
  }, []);

  // Make sure to update permanent storage whenever a message is read
  useEffect(() => {
    socket.on("messageRead", (data) => {
      if (!data || !data.messageId) return;
      
      // If we have a chatId, update the permanent storage
      if (data.chatId) {
        updatePermanentReadStatus(data.chatId, true);
      }
    });
    
    return () => {
      socket.off("messageRead");
    };
  }, [updatePermanentReadStatus]);

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Left Sidebar (Navbar) */}
      <Nav 
        isChatViewActive={isChatOpen} 
        onChatBackClick={() => setIsChatOpen(false)} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col sm:ml-64 overflow-hidden">
        {/* Header removed */}

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Chat List */}
          <div className={`w-full ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} shadow-md rounded-l-lg overflow-y-auto ${isChatOpen ? 'hidden' : 'block'} sm:block sm:w-1/3`}>
            <div className="flex justify-between items-center p-4 sm:pl-4 pl-16">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Chats</h2>
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
                className={`w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-700'} rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300`}
              />
            </div>
            <ul className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
              {/* Use filteredChats directly - they're already sorted */}
              {filteredChats.map((chat) => (
                <li
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  className={`p-4 flex items-center gap-4 cursor-pointer ${
                    selectedChat?.id === chat.id 
                      ? darkMode ? "bg-gray-700" : "bg-gray-100" 
                      : ""
                  } ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <div className="relative">
                    <img
                      src={chat.profilePicture || "/default-profile.png"}
                      alt={chat.name}
                      className={`w-12 h-12 rounded-full object-cover border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
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
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'} truncate max-w-[70%]`}>
                        {chat.name}
                      </span>
                      <div className="flex items-center">
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} whitespace-nowrap`}>
                          {formatChatTime(chat.timestamp)}
                        </span>
                        {chat.unreadCount > 0 && (
                          <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center font-medium">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      {/* Message text without ticks in ChatList */}
                      <div className={`text-sm ${
                        chat.unreadCount > 0 
                          ? `font-medium ${darkMode ? 'text-gray-300' : 'text-gray-800'}`
                          : darkMode ? 'text-gray-400' : 'text-gray-500'
                      } truncate max-w-[90%] flex items-center`}>
                        <span className="truncate block">{chat.lastMessage}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Chat Window */}
          <div className={`flex-1 flex-col overflow-hidden ${isChatOpen ? 'flex' : 'hidden'} sm:flex`}>
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div
                  className={`relative p-4 w-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-800'} shadow-md sticky top-0 z-10 cursor-pointer`}
                  onClick={() => navigate(`/profile/${selectedChat.id}`)}
                >
                  {isChatOpen && (
                    <button
                      onClick={(e) => { 
                        e.stopPropagation();
                        setIsChatOpen(false); 
                      }}
                      className={`absolute top-1/2 left-4 -translate-y-1/2 z-20 p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} sm:hidden`}
                      aria-label="Back to chat list"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  <div className={`flex items-center ${isChatOpen ? 'ml-16 sm:ml-0' : ''}`}>
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

                {/* Messages - Optimized for performance with read status indicators */}
                <div className={`flex-1 p-4 overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                  <div className="flex flex-col space-y-3">
                    {messages.length > 0 ? (
                      messages.map((message, index) => {
                        // Skip invalid messages without rendering attempt
                        if (!message || !message.sender) return null;

                        // Determine if current user is the sender - optimized check
                        const isCurrentUser = message.sender.isCurrentUser || message.sender._id === currentUser.id;

                        // Skip rendering if not relevant to current chat
                        if (!isCurrentUser && !selectedChat) return null;

                        // Get timestamp from wherever it exists in the message object - optimized
                        const messageTimestamp = message.createdAt || message.timestamp || new Date().toISOString();

                        // Precompute classes for better performance
                        const containerClass = `flex w-full ${isCurrentUser ? "justify-end" : "justify-start"}`;
                        const bubbleClass = `max-w-[70%] px-4 py-2 rounded-2xl ${
                          isCurrentUser
                            ? "bg-red-300 text-gray-800 rounded-tr-none"
                            : darkMode 
                              ? "bg-gray-700 text-gray-200 rounded-tl-none shadow-sm" 
                              : "bg-purple-200 text-black rounded-tl-none shadow-sm"
                        }`;

                        return (
                          <div
                            key={message._id || `msg-${index}`}
                            className={containerClass}
                          >
                            <div className={bubbleClass}>
                              <p className="text-sm break-words">{message.content}</p>
                              <div className="flex justify-end items-center mt-1 text-right">
                                <span className={`text-xs ${darkMode ? 'text-grey-700' : 'text-gray-500'} mr-1`}>
                                  {formatMessageTime(messageTimestamp)}
                                </span>
                                {/* Show message status indicators for sent messages */}
                                {isCurrentUser && (
                                  <span className="text-xs text-gray-500 ml-1">
                                    {message.isRead ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" className="fill-blue-500" style={{display: 'inline-block'}}>
                                        <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
                                      </svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" className="fill-gray-500" style={{display: 'inline-block'}}>
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                      </svg>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex justify-center mt-4">
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No messages yet</p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Message Input */}
                <div className={`p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      placeholder="Message..."
                      className={`flex-1 px-4 py-2 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' 
                          : 'bg-gray-50 border-gray-200 text-gray-800'
                      } border rounded-full focus:outline-none focus:ring-2 focus:grad text-sm`}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      className={`p-2 rounded-full ${
                        messageInput.trim()
                          ? "grad text-white hover:grad"
                          : darkMode 
                            ? "bg-gray-700 text-black cursor-not-allowed" 
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
              <div className={`flex-1 flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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