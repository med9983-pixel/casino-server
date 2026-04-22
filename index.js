const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/", (req, res) => res.send("OK"));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// 🎯 نقاط الانفجار
const crashList = [
  1.12, 1.45, 2.21, 1.38, 1.54, 1.99, 2.44, 2.40,
  1.32, 1.58, 2.11, 2.37, 3.11, 4.02, 4.44,
  1.45, 2.44, 3.98, 4.84, 17.88, 25.87, 1.00
];

let index = 0;

let fakePlayers = [];
let betCount = 0;
let totalBets = 0;
let totalProfit = 0;

// 🎲 توليد لاعبين
function generatePlayers() {
  fakePlayers = [];

  let count = random(6000, 12000);
  betCount = count;

  totalBets = random(15000, 22000);
  totalProfit = 0;

  for (let i = 0; i < 40; i++) {
    fakePlayers.push({
      user: "user_" + random(1000, 9999),
      bet: random(5, 200),
      cashout: (Math.random() * 20 + 1).toFixed(2),
      profit: 0,
      cashed: false
    });
  }
}

// ⏳ عداد طبيعي (بدون تسريع)
function startCountdown() {
  let time = 7;

  generatePlayers();

  const interval = setInterval(() => {

    // 🔥 زيادة تدريجية ناعمة
    betCount += random(50, 120);
    totalBets += random(200, 600);

    io.emit("stats", {
      betCount,
      totalBets,
      totalProfit
    });

    io.emit("history", fakePlayers.slice(0, 30));

    io.emit("countdown", time);
    time--;

    if (time < 0) {
      clearInterval(interval);
      startGame();
    }

  }, 1000);
}

// ✈️ اللعبة
function startGame() {

  let multiplier = 1.00;
  const crashPoint = crashList[index++ % crashList.length];

  io.emit("gameStart");

  const interval = setInterval(() => {

    // ⚡ سرعة واقعية
    if (multiplier < 2) multiplier += 0.03;
    else if (multiplier < 5) multiplier += 0.05;
    else if (multiplier < 10) multiplier += 0.1;
    else multiplier += 0.2;

    multiplier = parseFloat(multiplier.toFixed(2));

    // 🎯 سحب تدريجي طبيعي
    fakePlayers.forEach(p => {
      if (!p.cashed && multiplier >= p.cashout) {
        p.cashed = true;
        p.profit = p.bet * p.cashout;
        totalProfit += p.profit;
      }
    });

    io.emit("multiplier", multiplier);

    io.emit("stats", {
      betCount,
      totalBets,
      totalProfit
    });

    io.emit("history", fakePlayers.slice(0, 30));

    // 💥 انفجار
    if (multiplier >= crashPoint) {
      clearInterval(interval);

      io.emit("crash", crashPoint);

      setTimeout(startCountdown, 4000);
    }

  }, 100);

}

function random(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

// 🚀 تشغيل
startCountdown();

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on " + PORT);
});