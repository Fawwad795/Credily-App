import socket from './socket';

export const debugSocket = () => {
  console.log("Socket connection status:", socket.connected);
  console.log("Socket ID:", socket.id);
  
  // Test emit
  socket.emit('ping', { timestamp: new Date() });
  
  // Set up test listeners
  socket.on('pong', (data) => {
    console.log("Received pong response:", data);
  });
};

// Add this to your app:
// import { debugSocket } from '../utils/socketDebugger';
// debugSocket();