const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/", (req, res) => res.send("OK"));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let fakePlayers = [];
let betCount = 0;
let totalBets = 0;
let totalProfit = 0;

const crashList = [
  1.12, 1.45, 2.21, 1.38, 1.54, 1.99, 2.44, 2.40,
  1.32, 1.58, 2.11, 2.37, 3.11, 4.02, 4.44,
  1.45, 2.44, 3.98, 4.84, 17.88, 25.87, 1.00
];

let index = 0;

// 🎯 توليد لاعبين
function generatePlayers() {
  fakePlayers = [];

  betCount = random(6000, 12000);
  totalBets = random(15000, 22000);
  totalProfit = 0;

  for (let i = 0; i < 40; i++) {

    let id = random(10000000, 99999999).toString();
    let user = id.substring(0, 5) + "**";

    let bet = randomFloat(10, 900);
    let cashout = randomFloat(1.2, 20);

    fakePlayers.push({
      user,
      bet,
      cashout,
      profit: 0,
      cashed: false
    });
  }

  // 🔥 ترتيب من الأعلى للأقل
  fakePlayers.sort((a, b) => b.bet - a.bet);
}

// ⏳ العد التنازلي
function startCountdown() {

  let time = 7;
  generatePlayers();

  const interval = setInterval(() => {

    betCount += random(80, 150);
    totalBets += random(300, 800);

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

    if (multiplier < 2) multiplier += 0.03;
    else if (multiplier < 5) multiplier += 0.05;
    else if (multiplier < 10) multiplier += 0.1;
    else multiplier += 0.2;

    multiplier = parseFloat(multiplier.toFixed(2));

    fakePlayers.forEach(p => {
      if (!p.cashed && multiplier >= p.cashout) {

        if (Math.random() > 0.2) {

          p.cashed = true;

          p.profit = parseFloat((p.bet * p.cashout).toFixed(2));
          totalProfit += p.profit;
        }
      }
    });

    io.emit("multiplier", multiplier);

    io.emit("stats", {
      betCount,
      totalBets,
      totalProfit
    });

    io.emit("history", fakePlayers.slice(0, 30));

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

function randomFloat(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

startCountdown();

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on " + PORT);
});