const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

// ✅ رد سريع جداً (مهم لـ Railway)
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

const server = http.createServer(app);

// مهم: إعداد Socket.IO بشكل متوافق
const io = new Server(server, {
  cors: { origin: "*" },
  transports: ["websocket", "polling"]
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

// ❗ مهم جداً
const PORT = process.env.PORT || 3000;

// ❗ اجعل السيرفر يستمع على 0.0.0.0
server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});