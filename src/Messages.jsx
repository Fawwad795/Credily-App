import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import Nav from './Nav'; // Import the Nav component

const MessagingPage = () => {
  const [chats, setChats] = useState([]); // List of chats
  const [selectedChat, setSelectedChat] = useState(null); // Currently selected chat
  const [messages, setMessages] = useState([]); // Messages for the selected chat
  const [messageInput, setMessageInput] = useState(''); // Input for new messages

  // Fetch all chats on component mount
  useEffect(() => {
    fetch('/api/chats') // Replace with your backend API endpoint
      .then((response) => response.json())
      .then((data) => setChats(data))
      .catch((error) => console.error('Error fetching chats:', error));
  }, []);

  // Fetch messages for the selected chat
  const fetchMessages = (chatId) => {
    fetch(`/api/chats/${chatId}`) // Replace with your backend API endpoint
      .then((response) => response.json())
      .then((data) => setMessages(data))
      .catch((error) => console.error('Error fetching messages:', error));
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

      // Send the message to the backend
      fetch(`/api/chats/${selectedChat.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessage),
      })
        .then((response) => {
          if (response.ok) {
            setMessages((prevMessages) => [...prevMessages, newMessage]); // Update messages locally
            setMessageInput(''); // Clear the input field
          } else {
            console.error('Error sending message');
          }
        })
        .catch((error) => console.error('Error sending message:', error));
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar (Navbar) */}
      <Nav />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64"> {/* Added `ml-64` to account for the navbar width */}
        {/* Header */}
        <header className="bg-teal-500 text-white py-4 px-6 flex justify-between items-center">
          <h1 className="text-xl font-bold">Messages</h1>
        </header>

        {/* Main Content */}
        <div className="flex flex-1">
          {/* Sidebar */}
          <div className="w-1/3 bg-white border-r overflow-y-auto">
            <h2 className="text-xl font-bold p-4 border-b">Chats</h2>
            <ul>
              {chats.map((chat) => (
                <li
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  className={`p-4 cursor-pointer hover:bg-gray-200 ${
                    selectedChat?.id === chat.id ? 'bg-gray-200' : ''
                  }`}
                >
                  {chat.name}
                </li>
              ))}
            </ul>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b bg-white">
                  <h2 className="text-lg font-bold">{selectedChat.name}</h2>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`mb-2 p-2 rounded-lg ${
                        message.sender === 'You'
                          ? 'bg-teal-100 self-end'
                          : 'bg-gray-300 self-start'
                      }`}
                    >
                      <p className="text-sm font-bold">{message.sender}</p>
                      <p>{message.content}</p>
                      <p className="text-xs text-gray-500">{new Date(message.timestamp).toLocaleTimeString()}</p>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t bg-white flex items-center">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="ml-4 bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition duration-300"
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