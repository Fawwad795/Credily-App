import React, { useState, useEffect } from "react";
import axios from "axios"; // Install axios if not already installed
import Nav from "../components/Nav"; // Updated import path

const MessagingPage = () => {
  const [chats, setChats] = useState([]); // List of chats
  const [selectedChat, setSelectedChat] = useState(null); // Currently selected chat
  const [messages, setMessages] = useState([]); // Messages for the selected chat
  const [messageInput, setMessageInput] = useState(""); // Input for new messages
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch chats from the backend
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await axios.get("/api/chats"); // Replace with your backend endpoint
        setChats(response.data);
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    };

    fetchChats();
  }, []);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get("/api/unread-count"); // Replace with your backend endpoint
        setUnreadCount(response.data.unreadCount);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();
  }, []);

  // Fetch messages for a specific chat
  const fetchMessages = async (chatId) => {
    try {
      const response = await axios.get(`/api/chats/${chatId}/messages`); // Replace with your backend endpoint
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Handle selecting a chat
  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    fetchMessages(chat.id); // Fetch messages for the selected chat
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (messageInput.trim() && selectedChat) {
      try {
        const newMessage = {
          content: messageInput,
          sender: "You", // Replace with the actual sender (e.g., user ID)
        };

        // Send the message to the backend
        const response = await axios.post(
          `/api/chats/${selectedChat.id}/messages`,
          newMessage
        ); // Replace with your backend endpoint

        // Update messages locally
        setMessages((prevMessages) => [...prevMessages, response.data]);
        setMessageInput(""); // Clear the input field
      } catch (error) {
        console.error("Error sending message:", error);
      }
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
                  className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-100 rounded-full ${
                    selectedChat?.id === chat.id ? "bg-gray-100" : ""
                  }`}
                >
                  <img
                    src={
                      chat.profilePicture ||
                      generateProfilePlaceholder(chat.name)
                    }
                    alt={chat.name}
                    className="w-12 h-12 rounded-full"
                    onError={(e) => handleImageError(e, chat.name)}
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-700">
                      {chat.name}
                    </span>
                    {chat.unreadCount > 0 && (
                      <span className="ml-2 text-sm bg-red-500 text-white px-2 py-1 rounded-full">
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
                <div className="p-4 bg-gray-50 text-gray-800 shadow-md rounded-t-lg">
                  <h2 className="text-lg font-bold">{selectedChat.name}</h2>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`mb-4 flex items-start gap-4 ${
                        message.sender === "You"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      {message.sender !== "You" && (
                        <img
                          src={
                            message.profilePicture ||
                            generateProfilePlaceholder(message.sender)
                          }
                          alt={message.sender}
                          className="w-10 h-10 rounded-full"
                          onError={(e) => handleImageError(e, message.sender)}
                        />
                      )}
                      <div
                        className={`max-w-xs p-4 rounded-2xl shadow-md ${
                          message.sender === "You"
                            ? "bg-gray-200 text-gray-700"
                            : "bg-white text-gray-700 border border-gray-200"
                        }`}
                      >
                        <p className="text-sm font-bold">{message.sender}</p>
                        <p>{message.content}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      {message.sender === "You" && (
                        <img
                          src={
                            message.profilePicture ||
                            generateProfilePlaceholder("You")
                          }
                          alt={message.sender}
                          className="w-10 h-10 rounded-full"
                          onError={(e) => handleImageError(e, "You")}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 bg-white flex items-center shadow-md rounded-b-lg">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-700"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="ml-4 grad text-white px-6 py-2 rounded-full hover:opacity-90 transition duration-300 shadow-md"
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
