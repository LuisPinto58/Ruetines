import io from 'https://cdn.socket.io/4.5.4/socket.io.js';

class SocketClient {
  constructor(serverUrl = 'http://localhost:3000') {
    this.socket = io(serverUrl);
    this.listeners = {};
    this.setupDefaultListeners();
  }

  // Setup default event listeners
  setupDefaultListeners() {
    this.socket.on('connect', () => {
      console.log('[Socket] Connected to server');
      this.emit('socket-connected');
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
      this.emit('socket-disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('[Socket] Error:', error);
      this.emit('socket-error', error);
    });
  }

  // Join a specific chat
  joinChat(chatId, userId) {
    console.log(`[Socket] Joining chat ${chatId} as user ${userId}`);
    this.socket.emit('join-chat', { chatId, userId });
  }

  // Send message to chat
  sendMessage(chatId, userId, text) {
    if (!text?.trim()) {
      console.warn('[Socket] Empty message');
      return;
    }
    console.log(`[Socket] Sending message to chat ${chatId}`);
    this.socket.emit('send-message', { chatId, userId, text });
  }

  // Create new chat
  createChat(type, userId) {
    console.log(`[Socket] Creating ${type} chat`);
    this.socket.emit('create-chat', { type, userId });
  }

  // Add user to chat
  addUserToChat(chatId, userId, userToAdd) {
    console.log(`[Socket] Adding user ${userToAdd} to chat ${chatId}`);
    this.socket.emit('add-user-to-chat', { chatId, userId, userToAdd });
  }

  // Leave chat
  leaveChat(chatId, userId) {
    console.log(`[Socket] Leaving chat ${chatId}`);
    this.socket.emit('leave-chat', { chatId, userId });
  }

  // Listen for events
  on(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);

    // Also setup socket listener if not already done
    this.socket.on(eventName, (data) => {
      console.log(`[Socket] Event received: ${eventName}`, data);
      this.emit(eventName, data);
    });
  }

  // Emit custom events
  emit(eventName, data) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach(callback => callback(data));
    }
  }

  // Remove event listener
  off(eventName, callback) {
    if (this.listeners[eventName]) {
      this.listeners[eventName] = this.listeners[eventName].filter(cb => cb !== callback);
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  // Check if connected
  isConnected() {
    return this.socket.connected;
  }
}

// Create and export singleton instance
export const socketClient = new SocketClient();
export default socketClient;