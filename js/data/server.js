const path = require("path");
const express = require("express");
const jsonServer = require("json-server");
const auth = require("json-server-auth");
const http = require("http");
const { Server } = require("socket.io");

//setting up server with socket.io and json-server with auth

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  },
});

const router = jsonServer.router(path.join(__dirname, "db.json"));
const middlewares = jsonServer.defaults();
const rules = auth.rewriter(require(path.join(__dirname, "routes.json")));

app.db = router.db;
app.use(middlewares);
app.use(express.json());
app.use(rules);
app.use(auth);
app.use(router);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join_chat", (chatId) => { //joining room
    if (!chatId) return;
    const roomName = `chat_${chatId}`;
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined room ${roomName}`);
  });

  socket.on("leave_chat", (chatId) => { //leaving room
    if (!chatId) return;
    const roomName = `chat_${chatId}`;
    socket.leave(roomName);
    console.log(`Socket ${socket.id} left room ${roomName}`);
  });

  socket.on("new_chat_message", ({ chatId, message }) => { //broadcasting new message to room
    if (!chatId) return;
    const roomName = `chat_${chatId}`;
    console.log("New chat message received on socket:", { chatId, message });
    socket.to(roomName).emit("refresh_chat", { chatId, message });
  });

  socket.on("disconnect", () => { //log disconnection
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000; //use port 3000 as default, add env in production if desired (less setup steps for evaluation)
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
