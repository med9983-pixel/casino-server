const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

// اختبار السيرفر
app.get("/", (req, res) => {
  res.send("OK");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// 🔥 متغيرات اللعبة
let multiplier = 1.00;
let isRunning = false;

// عند اتصال مستخدم
io.on("connection", (socket) => {
  console.log("User connected");
});

// 🔥 تشغيل لعبة الكراش
function startGame() {
  multiplier = 1.00;
  isRunning = true;

  console.log("Game Started");

  io.emit("gameStart");

  const interval = setInterval(() => {
    multiplier += 0.05;

    io.emit("multiplier", multiplier.toFixed(2));

    // احتمال الانفجار
    if (Math.random() < 0.02) {
      clearInterval(interval);
      isRunning = false;

      console.log("CRASH at:", multiplier.toFixed(2));

      io.emit("crash", multiplier.toFixed(2));

      // إعادة الجولة بعد 3 ثواني
      setTimeout(startGame, 3000);
    }
  }, 100);
}

// بدء أول لعبة
startGame();

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});