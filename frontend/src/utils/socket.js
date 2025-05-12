import { io } from "socket.io-client";

// Define possible backend URLs in order of preference
const BACKEND_URLS = [
  "http://localhost:5000", 
  "http://localhost:3000", 
  "http://localhost:8900"
];

// Initialize with the first URL
let socket = null;

// Use more robust connection logic
const connectToSocketIO = () => {
  console.log("Attempting to connect to Socket.IO server...");
  
  // Try the primary URL first
  const primaryUrl = BACKEND_URLS[0];
  
  socket = io(primaryUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000
  });

  // Set up event listeners
  socket.on('connect', () => {
    console.log(`Socket.IO connected successfully to ${primaryUrl} with ID:`, socket.id);
  });

  socket.on('connect_error', (error) => {
    console.error(`Socket.IO connection error to ${primaryUrl}:`, error);
    
    // Try alternative URLs if primary fails
    tryAlternativeUrls();
  });

  socket.on('disconnect', (reason) => {
    console.log(`Socket.IO disconnected from ${primaryUrl}. Reason:`, reason);
    
    if (reason === 'io server disconnect' || reason === 'transport close') {
      // Server initiated disconnect or connection closed - try to reconnect
      socket.connect();
    }
  });

  return socket;
};

// Try alternative URLs if primary connection fails
const tryAlternativeUrls = () => {
  // Start from index 1 since we already tried the first URL
  for (let i = 1; i < BACKEND_URLS.length; i++) {
    const alternativeUrl = BACKEND_URLS[i];
    
    console.log(`Primary connection failed. Trying alternative URL: ${alternativeUrl}`);
    
    // Disconnect existing socket if any
    if (socket) {
      socket.disconnect();
    }
    
    // Create new connection to alternative URL
    socket = io(alternativeUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    });
    
    socket.on('connect', () => {
      console.log(`Socket.IO connected successfully to alternative URL ${alternativeUrl} with ID:`, socket.id);
      return; // Successfully connected
    });
    
    socket.on('connect_error', (error) => {
      console.error(`Socket.IO connection error to alternative URL ${alternativeUrl}:`, error);
      // Continue to next URL in the loop
    });
  }
  
  console.error("Failed to connect to any Socket.IO server. Check if your backend is running.");
};

// Initialize the socket connection
const socketClient = connectToSocketIO();

export default socketClient;