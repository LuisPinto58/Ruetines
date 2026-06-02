const express = require('express');
const http = require('node:http');
const { Server } = require('socket.io');
const jsonServer = require('json-server');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const router = jsonServer.router('db.json');

app.use(express.json());
app.use('/api', router);

// Helper functions
function chatRoomId(chatId) {
  return `chat:${chatId}`;
}

function isUserInChat(chat, userId) {
  return chat && chat.users && chat.users.some(user => user.id === userId);
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);

  // Join a specific chat room
  socket.on('join-chat', ({ chatId, userId }) => {
    try {
      const chat = router.db.get('chats').find({ id: chatId }).value();
      
      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      if (!isUserInChat(chat, userId)) {
        socket.emit('error', { message: 'User not allowed in this chat' });
        return;
      }

      socket.data.userId = userId;
      socket.data.chatId = chatId;
      socket.join(chatRoomId(chatId));

      // Send chat history to the user
      socket.emit('chat-loaded', {
        chatId,
        messages: chat.messages || [],
        users: chat.users || [],
        type: chat.type,
        status: chat.status
      });

      // Notify others that user joined
      socket.to(chatRoomId(chatId)).emit('user-joined', {
        userId,
        chatId,
        timestamp: new Date().toISOString()
      });

      console.log(`[Socket] User ${userId} joined chat ${chatId}`);
    } catch (error) {
      console.error('[Socket] Error joining chat:', error);
      socket.emit('error', { message: 'Error joining chat' });
    }
  });

  // Send a message to chat
  socket.on('send-message', ({ chatId, userId, text }) => {
    try {
      const chat = router.db.get('chats').find({ id: chatId }).value();

      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      if (!isUserInChat(chat, userId)) {
        socket.emit('error', { message: 'User not allowed in this chat' });
        return;
      }

      // Check group size limit
      if (chat.type === 'group' && chat.users.length > 5) {
        socket.emit('error', { message: 'Group chat is full' });
        return;
      }

      // Create message object
      const message = {
        content: text.trim(),
        sender: userId,
        timestamp: new Date().toISOString()
      };

      // Update chat messages in database
      if (!chat.messages) {
        chat.messages = [];
      }
      chat.messages.push(message);

      // Write to database
      router.db.get('chats').find({ id: chatId }).assign(chat).write();

      // Broadcast message to all users in the chat room
      io.to(chatRoomId(chatId)).emit('new-message', {
        chatId,
        message
      });

      console.log(`[Socket] Message sent to chat ${chatId} by user ${userId}`);
    } catch (error) {
      console.error('[Socket] Error sending message:', error);
      socket.emit('error', { message: 'Error sending message' });
    }
  });

  // Create a new chat
  socket.on('create-chat', ({ type, userId }) => {
    try {
      const newChat = {
        id: require('crypto').randomUUID(),
        type, // 'individual' or 'group'
        timeStamp: new Date().toISOString(),
        status: 'active',
        users: [
          {
            id: userId,
            identifier: '#8a9e83',
            textColor: '#ffffff'
          }
        ],
        messages: []
      };

      router.db.get('chats').push(newChat).write();

      socket.emit('chat-created', {
        chatId: newChat.id,
        chat: newChat
      });

      console.log(`[Socket] New ${type} chat created: ${newChat.id}`);
    } catch (error) {
      console.error('[Socket] Error creating chat:', error);
      socket.emit('error', { message: 'Error creating chat' });
    }
  });

  // Add user to chat
  socket.on('add-user-to-chat', ({ chatId, userId, userToAdd }) => {
    try {
      const chat = router.db.get('chats').find({ id: chatId }).value();

      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      if (!isUserInChat(chat, userId)) {
        socket.emit('error', { message: 'User not allowed to add members' });
        return;
      }

      // Check limits
      if (chat.type === 'individual' && chat.users.length >= 2) {
        socket.emit('error', { message: 'Individual chat is full' });
        return;
      }

      if (chat.type === 'group' && chat.users.length >= 5) {
        socket.emit('error', { message: 'Group chat is full' });
        return;
      }

      if (chat.users.some(u => u.id === userToAdd)) {
        socket.emit('error', { message: 'User already in chat' });
        return;
      }

      const colors = ['#685fa0', '#c07a56', '#3d3d3d', '#edebe4'];
      const identifiers = ['#8a9e83', '#685fa0', '#c07a56', '#3d3d3d', '#edebe4'];

      const newUser = {
        id: userToAdd,
        identifier: identifiers[chat.users.length % identifiers.length],
        textColor: colors[chat.users.length % colors.length]
      };

      chat.users.push(newUser);
      router.db.get('chats').find({ id: chatId }).assign(chat).write();

      io.to(chatRoomId(chatId)).emit('user-added', {
        chatId,
        user: newUser
      });

      console.log(`[Socket] User ${userToAdd} added to chat ${chatId}`);
    } catch (error) {
      console.error('[Socket] Error adding user:', error);
      socket.emit('error', { message: 'Error adding user to chat' });
    }
  });

  // Leave chat
  socket.on('leave-chat', ({ chatId, userId }) => {
    try {
      socket.leave(chatRoomId(chatId));

      socket.to(chatRoomId(chatId)).emit('user-left', {
        userId,
        chatId,
        timestamp: new Date().toISOString()
      });

      console.log(`[Socket] User ${userId} left chat ${chatId}`);
    } catch (error) {
      console.error('[Socket] Error leaving chat:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${socket.id}`);
  });
});

// Start server
server.listen(3000, () => {
  console.log('Chat server running at http://localhost:3000');
});