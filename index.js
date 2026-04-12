const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

let globalCounter = 0;

io.on("connection", (socket) => {
  console.log("User connected");

  socket.emit("counter", globalCounter);

  socket.on("increment", () => {
    globalCounter++;
    io.emit("counter", globalCounter);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});