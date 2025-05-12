// Store connected users with both ID and email
let users = [];

// Add a user to the connected users list
export const addUser = (userId, socketId, email = null) => {
  // Remove existing entries for the user to avoid duplicates
  users = users.filter((user) => user.userId !== userId && user.socketId !== socketId);
  // Add the new connection
  users.push({ userId, socketId, email });
};

// Remove a user from the connected users list
export const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

// Get a user by their ID
export const getUserById = (userId) => {
  return users.find((user) => user.userId === userId);
};

// Get a user by their email
export const getUserByEmail = (email) => {
  if (!email) return null;
  return users.find((user) => user.email === email);
};

// Get a user by their socket ID
export const getUserBySocketId = (socketId) => {
  return users.find((user) => user.socketId === socketId);
};

// Get all users
export const getAllUsers = () => {
  return users;
};