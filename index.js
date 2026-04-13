const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("OK");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

// 🎯 قائمة الانفجارات (بالترتيب)
const crashList = [
  1.05, 1.12, 1.08, 1.45, 2.21, 1.38, 1.54, 1.99, 2.44, 2.40,
  1.07, 1.32, 1.58, 2.11, 2.37, 3.11, 1.50, 4.02, 4.44, 4.49,
  1.01, 1.45, 2.44, 3.98, 4.84, 17.88, 25.87, 1.00
];

let currentIndex = 0;

// ⏳ العد التنازلي
function startCountdown() {
  let time = 7;

  const countdown = setInterval(() => {
    io.emit("countdown", time);
    time--;

    if (time < 0) {
      clearInterval(countdown);
      startGame();
    }
  }, 1000);
}

// ✈️ بدء اللعبة
function startGame() {
  let multiplier = 1.00;

  const crashPoint = crashList[currentIndex];
  currentIndex++;

  if (currentIndex >= crashList.length) {
    currentIndex = 0;
  }

  io.emit("gameStart");

  const interval = setInterval(() => {

    // 🎯 سرعات مختلفة حسب المضاعف
    if (multiplier < 3) {
      multiplier += 0.02;
    } else if (multiplier < 10) {
      multiplier += 0.05;
    } else if (multiplier < 20) {
      multiplier += 0.1;
    } else {
      multiplier += 0.2;
    }

    multiplier = parseFloat(multiplier.toFixed(2));

    io.emit("multiplier", multiplier);

    // 💥 شرط الانفجار
    if (multiplier >= crashPoint) {
      clearInterval(interval);

      io.emit("crash", crashPoint);

      setTimeout(startCountdown, 3000);
    }

  }, 100);
}

// 🚀 بدء أول دورة
startCountdown();

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});