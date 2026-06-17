import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";

//socket to be used by controller
const socket = io("http://localhost:3000", {
  transports: ["websocket"],
  autoConnect: true,
});

socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

socket.on("disconnect", () => {
  console.log("Socket disconnected");
});

export default socket;
