const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/", (req, res) => res.send("OK"));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// 🎯 مضاعفات
const crashList = [
  1.05, 1.12, 1.08, 1.45, 2.21, 1.38, 1.54, 1.99,
  2.44, 2.40, 1.07, 1.32, 1.58, 2.11, 2.37, 3.11,
  1.50, 4.02, 4.44, 4.49, 1.01, 1.45, 2.44,
  3.98, 4.84, 17.88, 25.87, 1.00
];

let currentIndex = 0;

// 🎲 بيانات
let players = [];
let history = [];

// 👤 أسماء وهمية
const names = ["Ali","Omar","Noor","Ahmed","Sara","John","Leo","Mona","Zaid","Khaled"];

// 🔥 توليد لاعب
function createPlayer() {
  return {
    username: names[Math.floor(Math.random()*names.length)],
    bet: +(Math.random()*50+1).toFixed(2),
    cashout: +(Math.random()*5+1).toFixed(2),
    profit: 0,
    status: "playing"
  };
}

// ⏳ العد التنازلي
function startCountdown() {

  players = [];
  history = [];

  let time = 7;

  const interval = setInterval(() => {

    // 🎯 زيادة لاعبين تدريجي
    let add = Math.floor(Math.random()*50)+20;

    for(let i=0;i<add;i++){
      players.push(createPlayer());
    }

    // 🔥 summary
    let totalBets = players.reduce((a,p)=>a+p.bet,0);

    io.emit("summary", {
      betCount: players.length,
      totalBets: totalBets.toFixed(2),
      totalProfit: 0
    });

    io.emit("countdown", time);

    time--;

    if(time < 0){
      clearInterval(interval);
      startGame();
    }

  },1000);
}

// ✈️ اللعبة
function startGame(){

  let multiplier = 1.00;
  let crashPoint = crashList[currentIndex++];
  if(currentIndex >= crashList.length) currentIndex = 0;

  io.emit("gameStart");

  const interval = setInterval(()=>{

    // سرعة
    if(multiplier < 3) multiplier += 0.02;
    else if(multiplier < 10) multiplier += 0.05;
    else multiplier += 0.1;

    multiplier = +multiplier.toFixed(2);

    io.emit("multiplier", multiplier);

    // 🎯 السحب العشوائي
    players.forEach(p=>{
      if(p.status === "playing" && multiplier >= p.cashout){
        p.status = "win";
        p.profit = +(p.bet * p.cashout).toFixed(2);

        history.unshift(p);
      }
    });

    // 💥 انفجار
    if(multiplier >= crashPoint){

      clearInterval(interval);

      players.forEach(p=>{
        if(p.status === "playing"){
          p.status = "lose";
          p.profit = 0;
          history.unshift(p);
        }
      });

      // 🔥 summary بعد الانفجار
      let totalProfit = history.reduce((a,p)=>a+p.profit,0);

      io.emit("summary", {
        betCount: players.length,
        totalBets: players.reduce((a,p)=>a+p.bet,0).toFixed(2),
        totalProfit: totalProfit.toFixed(2)
      });

      // 🔥 history
      io.emit("history", history.slice(0,40));

      io.emit("crash", crashPoint);

      setTimeout(startCountdown,3000);
    }

  },100);
}

// 🚀 بدء
startCountdown();

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", ()=>{
  console.log("Server running on "+PORT);
});