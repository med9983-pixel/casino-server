const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

// ✅ مهم: رد سريع جداً
app.get("/", (req, res) => {
  res.send("OK");
});

// إنشاء السيرفر
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

let globalCounter = 0;

io.on("connection", (socket) => {
  console.log("User connected");

  socket.emit("counter", globalCounter);

  socket.on("increment", () => {
    globalCounter++;
    io.emit("counter", globalCounter);
  });
});

// 🔥 أهم سطرين
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});