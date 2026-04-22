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

// 🎯 انفجارات
const crashList = [
  1.05, 1.12, 1.08, 1.45, 2.21, 1.38, 1.54, 1.99,
  2.44, 2.40, 1.07, 1.32, 1.58, 2.11, 2.37, 3.11,
  1.50, 4.02, 4.44, 4.49, 1.01, 1.45, 2.44, 3.98,
  4.84, 17.88, 25.87, 1.00
];

let index = 0;

// 🎯 بيانات
let players = [];
let betCount = 0;
let totalBets = 0;
let totalProfit = 0;

// 👤 اسم وهمي
function randomUser() {
  return Math.floor(100000 + Math.random() * 900000) + "";
}

// 🎯 توزيع سحب ذكي (هذا هو المهم 🔥)
function getCashoutTarget() {

  let r = Math.random();

  if (r < 0.25) return 1.2 + Math.random() * 0.8;   // ناس بدري
  if (r < 0.50) return 2 + Math.random() * 2;       // طبيعي
  if (r < 0.75) return 4 + Math.random() * 6;       // متوسط
  if (r < 0.90) return 10 + Math.random() * 10;     // عالي
  return 20 + Math.random() * 15;                   // قليل جداً يوصل عالي
}

// ⏳ العداد (كل ثانية)
function startCountdown() {

  let time = 7;

  players = [];
  betCount = 0;
  totalBets = 0;
  totalProfit = 0;

  // 🎯 الهدف
  let targetPlayers = 6000 + Math.floor(Math.random() * 7000);

  const timer = setInterval(() => {

    io.emit("countdown", time);

    // 🎯 إضافة تدريجية
    let add = Math.floor(targetPlayers / 7);

    for (let i = 0; i < add; i++) {

      let bet = 50 + Math.random() * 400;

      players.push({
        user: randomUser(),
        bet: bet,
        profit: 0,
        chance: 0,
        cashed: false,
        target: getCashoutTarget() // 🔥 هدف السحب
      });

      betCount++;
      totalBets += bet;
    }

    io.emit("stats", {
      betCount,
      totalBets: Math.floor(totalBets),
      totalProfit: Math.floor(totalProfit),
      players
    });

    time--;

    if (time < 0) {
      clearInterval(timer);
      startGame();
    }

  }, 1000); // ✅ كل ثانية طبيعي
}

// ✈️ اللعبة
function startGame() {

  let multiplier = 1.00;
  const crashPoint = crashList[index];

  index++;
  if (index >= crashList.length) index = 0;

  io.emit("gameStart");

  const interval = setInterval(() => {

    // 🎯 السرعة
    if (multiplier < 3) multiplier += 0.02;
    else if (multiplier < 10) multiplier += 0.05;
    else if (multiplier < 20) multiplier += 0.1;
    else multiplier += 0.2;

    multiplier = parseFloat(multiplier.toFixed(2));

    // 💰 السحب الذكي
    players.forEach(p => {

      if (!p.cashed && multiplier >= p.target) {

        p.cashed = true;
        p.chance = multiplier;
        p.profit = p.bet * multiplier;

        totalProfit += p.profit;
      }

    });

    io.emit("multiplier", multiplier);

    io.emit("stats", {
      betCount,
      totalBets: Math.floor(totalBets),
      totalProfit: Math.floor(totalProfit),
      players
    });

    // 💥 انفجار
    if (multiplier >= crashPoint) {

      clearInterval(interval);

      io.emit("crash", crashPoint);

      setTimeout(startCountdown, 3000);
    }

  }, 100);

}

// 🚀 تشغيل
startCountdown();

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on " + PORT);
});