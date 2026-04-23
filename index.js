const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/", (req, res) => res.send("OK"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

// 🎯 قائمة الانفجارات
const crashList = [
  1.05, 1.12, 1.08, 1.45, 2.21, 1.38, 1.54, 1.99, 2.44, 2.40,
  1.07, 1.32, 1.58, 2.11, 2.37, 3.11, 1.50, 4.02, 4.44, 4.49,
  1.01, 1.45, 2.44, 3.98, 4.84, 17.88, 25.87, 1.00
];

let currentIndex = 0;

// 📊 بيانات عامة
let betCount = 0;
let totalBets = 0;
let totalProfit = 0;

let fakePlayers = [];
let visibleCount = 0;

// 🔧 أدوات
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// 👥 توليد لاعبين
function generatePlayers() {

  fakePlayers = [];

  let count = random(30, 60);

  for (let i = 0; i < count; i++) {

    let user = "******" + random(10, 99);

    // 🎯 رهان مرتب من الكبير للصغير
    let bet = (random(10, 900)).toFixed(2);

    fakePlayers.push({
      user,
      bet,
      chance: "-",
      profit: "0.00",
      cashed: false
    });
  }

  // ترتيب من الأعلى للأقل
  fakePlayers.sort((a, b) => parseFloat(b.bet) - parseFloat(a.bet));
}

// ⏳ العد التنازلي
function startCountdown() {

  let time = 7;

  // 🔥 أرقام كبيرة واقعية
  betCount = random(6000, 12000);
  totalBets = random(15000, 22000);
  totalProfit = 0;

  generatePlayers();
  visibleCount = 0;

  const interval = setInterval(() => {

    // زيادة طبيعية
    betCount += random(50, 150);
    totalBets += random(200, 700);

    // ظهور تدريجي
    visibleCount += random(2, 5);
    if (visibleCount > fakePlayers.length) {
      visibleCount = fakePlayers.length;
    }

    shuffleArray(fakePlayers);

    io.emit("stats", {
      betCount,
      totalBets,
      totalProfit
    });

    io.emit("history", fakePlayers.slice(0, visibleCount));

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

  const crashPoint = crashList[currentIndex];
  currentIndex++;

  if (currentIndex >= crashList.length) {
    currentIndex = 0;
  }

  io.emit("gameStart");

  const interval = setInterval(() => {

    // السرعات
    if (multiplier < 3) multiplier += 0.02;
    else if (multiplier < 10) multiplier += 0.05;
    else if (multiplier < 20) multiplier += 0.1;
    else multiplier += 0.2;

    multiplier = parseFloat(multiplier.toFixed(2));

    // 🎯 سحب واقعي
    fakePlayers.forEach(p => {

      if (!p.cashed) {

        let chance = Math.random();

        if (
          (multiplier > 1.5 && chance < 0.05) ||
          (multiplier > 2 && chance < 0.08) ||
          (multiplier > 3 && chance < 0.12) ||
          (multiplier > 5 && chance < 0.2) ||
          (multiplier > 10 && chance < 0.3) ||
          (multiplier > 20 && chance < 0.4)
        ) {
          p.cashed = true;
          p.chance = multiplier + "x";

          let profit = (parseFloat(p.bet) * multiplier);
          profit = Math.floor(profit * 100) / 100;

          p.profit = profit.toFixed(2);

          totalProfit += profit;
        }
      }
    });

    shuffleArray(fakePlayers);

    io.emit("multiplier", multiplier);

    io.emit("stats", {
      betCount,
      totalBets,
      totalProfit: Math.floor(totalProfit)
    });

    io.emit("history", fakePlayers.slice(0, random(25, 40)));

    // 💥 الانفجار
    if (multiplier >= crashPoint) {

      clearInterval(interval);

      fakePlayers.forEach(p => {
        if (!p.cashed) {
          p.chance = "💥";
          p.profit = "-" + p.bet;
        }
      });

      io.emit("crash", crashPoint);

      io.emit("history", fakePlayers.slice(0, 40));

      setTimeout(startCountdown, 3000);
    }

  }, 100);
}

// 🚀 تشغيل
startCountdown();

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});