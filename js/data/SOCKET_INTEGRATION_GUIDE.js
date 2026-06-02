// Integration guide for using Socket.io with your chat application

/*
=== HOW TO USE SOCKET.IO IN YOUR CHAT APP ===

1. SETUP SOCKET LISTENERS
   In your chat-view.js or chat-controller.js, listen for socket events:

   import socketClient from "../data/socketClient.js";

   // Listen for new messages
   socketClient.on('new-message', ({ chatId, message }) => {
     console.log('New message received:', message);
     // Update UI with new message
   });

   // Listen for user joined
   socketClient.on('user-joined', ({ userId, chatId }) => {
     console.log('User joined:', userId);
     // Update UI to show user joined
   });

   // Listen for user left
   socketClient.on('user-left', ({ userId, chatId }) => {
     console.log('User left:', userId);
     // Update UI to show user left
   });

   // Listen for chat loaded
   socketClient.on('chat-loaded', ({ chatId, messages, users, type, status }) => {
     console.log('Chat loaded:', { chatId, messages, users });
     // Initialize chat with history
   });

   // Listen for chat created
   socketClient.on('chat-created', ({ chatId, chat }) => {
     console.log('Chat created:', chatId);
     // Handle new chat creation
   });

   // Listen for user added
   socketClient.on('user-added', ({ chatId, user }) => {
     console.log('User added:', user);
     // Update user list
   });

   // Listen for errors
   socketClient.on('error', (error) => {
     console.error('Socket error:', error);
     // Handle error
   });

2. EMIT SOCKET EVENTS FOR USER ACTIONS

   // Join a chat
   socketClient.joinChat(chatId, userId);

   // Send a message
   socketClient.sendMessage(chatId, userId, messageText);

   // Create new chat
   socketClient.createChat('group', userId); // or 'individual'

   // Add user to chat
   socketClient.addUserToChat(chatId, currentUserId, newUserId);

   // Leave chat
   socketClient.leaveChat(chatId, userId);

3. EVENT FLOW EXAMPLE

   User clicks "Send Message":
   → socketClient.sendMessage(chatId, userId, text)
   → Server receives 'send-message' event
   → Server stores message in db.json
   → Server broadcasts 'new-message' to all users in that chat
   → All clients receive 'new-message' event
   → UI updates for all participants in real-time

4. MIGRATION FROM FETCH TO SOCKET.IO

   Old (Fetch):
   handleSendMessage = async (chat, text) => {
     const currentUserId = JSON.parse(localStorage.getItem("user"))?.id;
     chatInstance.addMessage(text.trim(), currentUserId);
     await addChatMessage(chatInstance.id, { messages: chatInstance.messages });
   }

   New (Socket.io):
   handleSendMessage = (chat, text) => {
     const currentUserId = JSON.parse(localStorage.getItem("user"))?.id;
     socketClient.sendMessage(chat.id, currentUserId, text);
     // Listen to 'new-message' event to update UI
   }

5. SERVER EVENTS EXPLAINED

   join-chat: User joins a specific chat room
   └─ Response: 'chat-loaded' with messages and users

   send-message: User sends a message
   └─ Response: 'new-message' broadcast to all in room

   create-chat: User creates new chat
   └─ Response: 'chat-created' with new chat data

   add-user-to-chat: Add user to existing chat
   └─ Response: 'user-added' broadcast to all in room

   leave-chat: User leaves chat
   └─ Response: 'user-left' broadcast to remaining users

*/

export const socketIntegration = {
  // Documentation only - see comments above for usage
};
