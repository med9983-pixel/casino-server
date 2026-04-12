const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// صفحة رئيسية (مهم)
app.get("/", (req, res) => {
  res.send("🚀 Crash Game Server is Running");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

// 🔥 العداد العالمي
let globalCounter = 0;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // إرسال القيمة الحالية
  socket.emit("counter", globalCounter);

  // زيادة العداد
  socket.on("increment", () => {
    globalCounter++;
    io.emit("counter", globalCounter);
    console.log("Counter:", globalCounter);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ❗ مهم لـ Railway
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});