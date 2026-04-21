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

// 🎯 الانفجارات
const crashList = [
  1.05, 1.12, 1.08, 1.45, 2.21, 1.38, 1.54, 1.99, 2.44, 2.40,
  1.07, 1.32, 1.58, 2.11, 2.37, 3.11, 1.50, 4.02, 4.44, 4.49,
  1.01, 1.45, 2.44, 3.98, 4.84, 17.88, 25.87, 1.00
];

let currentIndex = 0;

// 📊 بيانات
let realPlayers = [];
let fakePlayers = [];
let history = [];

// 🔥 توليد وهمي
function randomUser() {
  return Math.floor(Math.random() * 90 + 10) + "*******";
}

function randomBet() {
  return +(Math.random() * 50 + 1).toFixed(2); // USDT
}

// ⏳ العد
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

// ✈️ اللعبة
function startGame() {

  let multiplier = 1.00;
  const crashPoint = crashList[currentIndex++];

  if (currentIndex >= crashList.length) currentIndex = 0;

  // 🔥 توليد لاعبين وهميين
  fakePlayers = [];
  let fakeCount = Math.floor(Math.random() * 10) + 10;

  for (let i = 0; i < fakeCount; i++) {
    fakePlayers.push({
      username: randomUser(),
      bet: randomBet(),
      cashedOut: false,
      profit: 0
    });
  }

  io.emit("gameStart");

  const interval = setInterval(() => {

    if (multiplier < 3) multiplier += 0.02;
    else if (multiplier < 10) multiplier += 0.05;
    else multiplier += 0.1;

    multiplier = +multiplier.toFixed(2);

    io.emit("multiplier", multiplier);

    // 🎯 fake cashout عشوائي
    fakePlayers.forEach(p => {
      if (!p.cashedOut && Math.random() < 0.02 && multiplier > 1.2) {
        p.cashedOut = true;
        p.profit = +(p.bet * multiplier).toFixed(2);
      }
    });

    if (multiplier >= crashPoint) {
      clearInterval(interval);

      // 💥 الخسارة
      [...realPlayers, ...fakePlayers].forEach(p => {
        if (!p.cashedOut) {
          p.profit = 0;
        }

        history.unshift({
          username: p.username,
          bet: p.bet,
          profit: p.profit
        });
      });

      history = history.slice(0, 30);

      // 📊 احصائيات
      let betCount = history.length;
      let totalBets = history.reduce((s, x) => s + x.bet, 0);
      let totalProfit = history.reduce((s, x) => s + x.profit, 0);

      io.emit("summary", {
        betCount,
        totalBets: totalBets.toFixed(2),
        totalProfit: totalProfit.toFixed(2)
      });

      io.emit("history", history);

      io.emit("crash", crashPoint);

      realPlayers = [];

      setTimeout(startCountdown, 3000);
    }

  }, 100);
}

// 🎮 لاعب حقيقي
io.on("connection", (socket) => {

  socket.on("placeBet", (data) => {
    realPlayers.push({
      username: data.username,
      bet: data.bet,
      cashedOut: false,
      profit: 0
    });
  });

  socket.on("cashout", (multi) => {
    let player = realPlayers.find(p => !p.cashedOut);
    if (player) {
      player.cashedOut = true;
      player.profit = +(player.bet * multi).toFixed(2);
    }
  });

});

startCountdown();

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0");