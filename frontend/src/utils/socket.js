import { io } from "socket.io-client";

// Define possible backend URLs in order of preference
const BACKEND_URLS = [
  "http://localhost:5000", 
  "http://localhost:3000", 
  "http://localhost:8900"
];

// Initialize with null - will be created in the function
let socket = null;

// Use more robust connection logic
const connectToSocketIO = () => {
  console.log("Attempting to connect to Socket.IO server...");
  
  // Try the primary URL first
  const primaryUrl = BACKEND_URLS[0];
  
  socket = io(primaryUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true,
    forceNew: true,
    extraHeaders: {
      "Authorization": `Bearer ${localStorage.getItem('token')}`
    }
  });

  // Set up event listeners
  socket.on('connect', () => {
    console.log(`Socket.IO connected successfully to ${primaryUrl} with ID:`, socket.id);
    
    // Automatically join rooms when connected
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail');
    
    if (userId) {
      socket.emit('joinRoom', userId);
      console.log(`Joined room for user ${userId}`);
      
      if (userEmail) {
        socket.emit('addUser', {
          userId,
          userEmail
        });
        console.log(`Registered user data: ${userEmail} (${userId})`);
      }
      
      // Register for messages
      socket.emit('registerForNewMessages', userId);
      console.log(`Registered for new messages for user ${userId}`);
    }
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
      setTimeout(() => {
        console.log('Attempting to reconnect...');
        socket.connect();
      }, 1000);
    }
  });

  // Add error handling
  socket.on('error', (error) => {
    console.error('Socket.IO error:', error);
  });

  // Add debug events
  socket.on('newMessage', (data) => {
    console.log('DEBUG: Socket received newMessage event:', data);
  });

  socket.on('messageRead', (data) => {
    console.log('DEBUG: Socket received messageRead event:', data);
  });

  socket.onAny((event, ...args) => {
    console.log(`DEBUG: Socket event ${event} received:`, args);
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
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      forceNew: true,
      extraHeaders: {
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    socket.on('connect', () => {
      console.log(`Socket.IO connected successfully to alternative URL ${alternativeUrl} with ID:`, socket.id);
      
      // Automatically join rooms when connected
      const userId = localStorage.getItem('userId');
      const userEmail = localStorage.getItem('userEmail');
      
      if (userId) {
        socket.emit('joinRoom', userId);
        
        if (userEmail) {
          socket.emit('addUser', {
            userId,
            userEmail
          });
        }
        
        // Register for messages
        socket.emit('registerForNewMessages', userId);
      }
      
      return; // Successfully connected
    });
    
    socket.on('connect_error', (error) => {
      console.error(`Socket.IO connection error to alternative URL ${alternativeUrl}:`, error);
      // Continue to next URL in the loop
    });

    socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
    });
  }
  
  console.error("Failed to connect to any Socket.IO server. Check if your backend is running.");
};

// Initialize the socket connection
const socketClient = connectToSocketIO();

export default socketClient;