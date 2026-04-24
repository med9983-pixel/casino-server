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
  1.05, 1.12, 1.08, 1.45, 2.21, 1.38, 1.54, 1.99,
  2.44, 2.40, 3.11, 4.02, 4.44, 4.49,
  17.88, 25.87, 1.00
];

let currentIndex = 0;

// 📊 بيانات
let betCount = 0;
let totalBets = 0;
let totalProfit = 0;

let fakePlayers = [];
let visibleCount = 0;

// 🔧 أدوات
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

// 👥 توليد اللاعبين
function generatePlayers() {

  fakePlayers = [];

  let count = random(35, 60);

  for (let i = 0; i < count; i++) {

    let user = "******" + random(10, 99);
    let bet = (random(10, 900)).toFixed(2);

    // 🎯 توزيع احترافي لنقطة السحب
    let r = Math.random();
    let target;

    if (r < 0.40) target = randomFloat(1.1, 2.5);      // بدري
    else if (r < 0.70) target = randomFloat(2.5, 6);   // متوسط
    else if (r < 0.90) target = randomFloat(6, 15);    // عالي
    else target = randomFloat(15, 35);                 // نادر 🔥

    fakePlayers.push({
      user,
      bet,
      chance: "-",
      profit: "0.00",
      cashed: false,
      target: parseFloat(target.toFixed(2))
    });
  }

  // ترتيب من الأعلى للأقل
  fakePlayers.sort((a, b) => parseFloat(b.bet) - parseFloat(a.bet));
}

// ⏳ العد التنازلي
function startCountdown() {

  let time = 7;

  betCount = random(6000, 12000);
  totalBets = random(15000, 22000);
  totalProfit = 0;

  generatePlayers();
  visibleCount = 0;

  const interval = setInterval(() => {

    betCount += random(80, 150);
    totalBets += random(300, 800);

    // 👇 ظهور تدريجي
    visibleCount += random(2, 5);
    if (visibleCount > fakePlayers.length) {
      visibleCount = fakePlayers.length;
    }

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

  if (currentIndex >= crashList.length) currentIndex = 0;

  io.emit("gameStart");

  const interval = setInterval(() => {

    // 🎯 سرعة المضاعف
    if (multiplier < 3) multiplier += 0.02;
    else if (multiplier < 10) multiplier += 0.05;
    else if (multiplier < 20) multiplier += 0.1;
    else multiplier += 0.2;

    multiplier = parseFloat(multiplier.toFixed(2));

    // 🔥 السحب الحقيقي (حسب target)
    fakePlayers.forEach(p => {

      if (!p.cashed && multiplier >= p.target) {

        p.cashed = true;
        p.chance = p.target.toFixed(2) + "x";

        let profit = parseFloat(p.bet) * p.target;
        profit = Math.floor(profit * 100) / 100;

        p.profit = profit.toFixed(2);

        totalProfit += profit;
      }

    });

    // 🔥 ترتيب ثابت
    fakePlayers.sort((a, b) => parseFloat(b.bet) - parseFloat(a.bet));

    io.emit("multiplier", multiplier);

    io.emit("stats", {
      betCount,
      totalBets,
      totalProfit: Math.floor(totalProfit)
    });

    // 🔥 نفس اللاعبين (لا حذف ولا إضافة)
    io.emit("history", fakePlayers);

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
      io.emit("history", fakePlayers);

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