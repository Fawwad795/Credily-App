import { io } from "socket.io-client";

// Define possible backend URLs in order of preference
const BACKEND_URLS = [
  "http://localhost:5000",
  "http://localhost:3000",
  "http://localhost:8900",
];

// Initialize with the first URL
let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

// Use more robust connection logic
const connectToSocketIO = () => {
  // Try the primary URL first
  const primaryUrl = BACKEND_URLS[0];

  socket = io(primaryUrl, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 500,
    timeout: 5000,
    autoConnect: true,
    forceNew: false,
  });

  // Set up event listeners
  socket.on("connect", () => {
    reconnectAttempts = 0;
    window.dispatchEvent(new CustomEvent("socketConnected"));
  });

  socket.on("connect_error", () => {
    reconnectAttempts++;

    if (reconnectAttempts >= 2) {
      tryAlternativeUrls();
    }
  });

  socket.on("reconnect", () => {
    window.dispatchEvent(new CustomEvent("socketConnected"));
  });

  socket.on("reconnect_failed", () => {
    // Try one more time with primary URL after a short delay
    setTimeout(() => {
      reconnectAttempts = 0;
      connectToSocketIO();
    }, 2000);
  });

  socket.on("disconnect", (reason) => {
    window.dispatchEvent(new CustomEvent("socketDisconnected"));

    if (reason === "io server disconnect" || reason === "transport close") {
      setTimeout(() => {
        socket.connect();
      }, 500);
    }
  });

  return socket;
};

// Try alternative URLs if primary connection fails
const tryAlternativeUrls = () => {
  // Start from index 1 since we already tried the first URL
  for (let i = 1; i < BACKEND_URLS.length; i++) {
    const alternativeUrl = BACKEND_URLS[i];

    // Disconnect existing socket if any
    if (socket) {
      socket.disconnect();
    }

    // Create new connection to alternative URL
    socket = io(alternativeUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 500,
    });

    socket.on("connect", () => {
      window.dispatchEvent(new CustomEvent("socketConnected"));
      return; // Successfully connected
    });
  }

  // Set up a periodic reconnect attempt
  setTimeout(() => {
    reconnectAttempts = 0;
    connectToSocketIO();
  }, 5000);
};

// Initialize the socket connection
const socketClient = connectToSocketIO();

// Expose manual reconnect function for use in components
socketClient.manualReconnect = () => {
  if (socket) {
    socket.disconnect();
  }
  return connectToSocketIO();
};

// Check connection status periodically and reconnect if needed
setInterval(() => {
  if (socketClient && !socketClient.connected) {
    socketClient.connect();
  }
}, 5000);

// Add handler for joining rooms that will work even if called before connection is ready
const originalEmit = socketClient.emit;
socketClient.emit = function (event, ...args) {
  if (event === "joinRoom" && !this.connected) {
    const userId = args[0];
    // Add event listener for reconnection
    const joinAfterConnect = () => {
      originalEmit.call(this, "joinRoom", userId);
      window.removeEventListener("socketConnected", joinAfterConnect);
    };
    window.addEventListener("socketConnected", joinAfterConnect, {
      once: true,
    });
    return this;
  }
  return originalEmit.apply(this, [event, ...args]);
};

export default socketClient;
