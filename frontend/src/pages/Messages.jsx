import React, { useState, useEffect } from 'react';
import Nav from '../components/Nav'; // Updated import path

const MessagingPage = () => {
  const [chats, setChats] = useState([]); // List of chats
  const [selectedChat, setSelectedChat] = useState(null); // Currently selected chat
  const [messages, setMessages] = useState([]); // Messages for the selected chat
  const [messageInput, setMessageInput] = useState(''); // Input for new messages

  // Mock chats data
  useEffect(() => {
    const mockChats = [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' },
      { id: 3, name: 'Team Alpha' },
    ];
    setChats(mockChats);
  }, []);

  // Mock messages data
  const fetchMessages = (chatId) => {
    const mockMessages = {
      1: [
        { sender: 'John Doe', content: 'Hey there!', timestamp: new Date().toISOString() },
        { sender: 'You', content: 'Hi John!', timestamp: new Date().toISOString() },
      ],
      2: [
        { sender: 'Jane Smith', content: 'Are you free tomorrow?', timestamp: new Date().toISOString() },
        { sender: 'You', content: 'Yes, let\'s meet up!', timestamp: new Date().toISOString() },
      ],
      3: [
        { sender: 'Team Alpha', content: 'Project deadline is next week.', timestamp: new Date().toISOString() },
        { sender: 'You', content: 'Got it, thanks!', timestamp: new Date().toISOString() },
      ],
    };
    setMessages(mockMessages[chatId] || []);
  };

  // Handle selecting a chat
  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    fetchMessages(chat.id); // Fetch messages for the selected chat
  };

  // Handle sending a message
  const handleSendMessage = () => {
    if (messageInput.trim() && selectedChat) {
      const newMessage = {
        content: messageInput,
        sender: 'You', // Replace with the actual sender (e.g., user ID)
        timestamp: new Date().toISOString(),
      };

      // Update messages locally
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessageInput(''); // Clear the input field
    }
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
        </header>

        {/* Main Content */}
        <div className="flex flex-1">
          {/* Sidebar */}
          <div className="w-1/3 bg-gray-50 border-r overflow-y-auto shadow-md rounded-l-lg">
            <h2 className="text-xl font-bold p-4 border-b">Chats</h2>
            <ul>
              {chats.map((chat) => (
                <li
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-100 rounded-lg ${
                    selectedChat?.id === chat.id ? "bg-gray-100" : ""
                  }`}
                >
                  <img
                    src={chat.profilePicture || "/default-profile.png"}
                    alt={chat.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <span className="font-medium text-gray-700">{chat.name}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b bg-gradient-to-l grad text-white shadow-md rounded-t-lg">
                  <h2 className="text-lg font-bold">{selectedChat.name}</h2>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`mb-4 flex items-start gap-4 ${
                        message.sender === "You" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.sender !== "You" && (
                        <img
                          src={message.profilePicture || "/default-profile.png"}
                          alt={message.sender}
                          className="w-10 h-10 rounded-full"
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
                          src={message.profilePicture || "/your-profile.png"}
                          alt={message.sender}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t bg-white flex items-center shadow-md rounded-b-lg">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-grad text-gray-700"
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
                <p className="text-gray-500">Select a chat to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagingPage;