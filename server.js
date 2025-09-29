const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Configuración CORS: Necesario para la conexión desde React (localhost:3000)
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", 
        methods: ["GET", "POST"]
    }
});

app.use(express.static('public')); 

const TICK_MS = 100;           // Frecuencia de actualización
const BETTING_SECONDS = 7;     // Tiempo para apostar
const LOCK_SECONDS = 1; 
const MAX_CRASH = 100.0; 
// FACTOR CLAVE AJUSTADO: Se ha reducido para que el crecimiento sea EXTREMADAMENTE lento al inicio.
const GROWTH_FACTOR = 0.000025; 

let roundId = 0;
let state = createEmptyRoundState();

function createEmptyRoundState() {
  return {
    id: null,
    status: 'idle', // 'idle', 'betting', 'running', 'ended'
    bets: new Map(), 
    startTime: null,
    crashAt: 1.0,
    multiplier: 1.0,
    timerHandle: null
  };
}

function chooseCrashMultiplier() {
  const r = Math.random(); 
  const alpha = 0.6;
  const raw = Math.pow(1 / (1 - r), alpha);
  const capped = Math.min(MAX_CRASH, raw);
  return Math.max(1.0, +capped.toFixed(2));
}

function broadcastRoundUpdate() {
  io.emit('tick', {
    roundId: state.id,
    status: state.status,
    multiplier: Number(state.multiplier.toFixed(2)),
  });
}

function endRound() {
  state.status = 'ended';
  const results = [];
  for (const [sid, b] of state.bets.entries()) {
    if (b.cashedOutAt) {
      const payout = +(b.amount * b.cashedOutAt).toFixed(2); 
      results.push({ socketId: sid, amount: b.amount, cashedAt: b.cashedOutAt, payout });
    } else {
      results.push({ socketId: sid, amount: b.amount, cashedAt: null, payout: 0 });
    }
  }
  io.emit('round_end', {
    roundId: state.id,
    crashAt: state.crashAt,
    results
  });
  setTimeout(startBettingPhase, 2000); // Espera 2s antes de la nueva ronda
}

function startTickingPhase() {
  state.status = 'running';
  state.multiplier = 1.0;
  
  let timeElapsed = 0; // Tiempo transcurrido en milisegundos

  state.timerHandle = setInterval(() => {
    timeElapsed += TICK_MS;
    
    // FÓRMULA EXPONENCIAL CORREGIDA: Multiplicador = e^(FACTOR * Tiempo)
    // Esto asegura que el crecimiento es lento al inicio (cerca de 1.00) y se acelera después.
    state.multiplier = Math.exp(GROWTH_FACTOR * timeElapsed); 
    
    state.multiplier = Number(state.multiplier.toFixed(4));
    broadcastRoundUpdate();

    if (state.multiplier >= state.crashAt) {
      state.multiplier = state.crashAt;
      broadcastRoundUpdate();
      clearInterval(state.timerHandle);
      state.timerHandle = null;
      endRound();
    }
  }, TICK_MS);
}

function startBettingPhase() {
  roundId += 1;
  state = createEmptyRoundState();
  state.id = roundId;
  state.status = 'betting';
  state.bets = new Map();
  state.startTime = Date.now();
  state.crashAt = chooseCrashMultiplier();
  io.emit('round_start', {
    roundId: state.id,
    bettingSeconds: BETTING_SECONDS,
  });

  let betSecondsLeft = BETTING_SECONDS;
  const bettingInterval = setInterval(() => {
    io.emit('bet_countdown', { roundId: state.id, secondsLeft: betSecondsLeft });
    betSecondsLeft -= 1;
    if (betSecondsLeft < 0) {
      clearInterval(bettingInterval);
      io.emit('bet_locked', { roundId: state.id });
      setTimeout(() => {
        startTickingPhase();
      }, LOCK_SECONDS * 1000);
    }
  }, 1000);
}

io.on('connection', socket => {
  console.log('conexión:', socket.id);
  socket.emit('welcome', {
    clientId: socket.id,
    current: {
      roundId: state.id,
      status: state.status,
      multiplier: Number(state.multiplier.toFixed(2)),
    }
  });

  socket.on('place_bet', data => {
    if (state.status !== 'betting') {
      socket.emit('bet_rejected', { reason: 'Betting closed' });
      return;
    }
    const amount = Number(data.amount);
    if (!amount || amount <= 0) {
      socket.emit('bet_rejected', { reason: 'Invalid amount' });
      return;
    }
    state.bets.set(socket.id, { amount, cashedOutAt: null, paid: false });
    socket.emit('bet_accepted', { roundId: state.id, amount });
    io.emit('bets_update', { totalBets: state.bets.size }); 
  });

  socket.on('cashout', () => {
    if (state.status !== 'running') {
      socket.emit('cashout_failed', { reason: 'Round not running' });
      return;
    }
    const b = state.bets.get(socket.id);
    if (!b) {
      socket.emit('cashout_failed', { reason: 'No bet' });
      return;
    }
    if (b.cashedOutAt) {
      socket.emit('cashout_failed', { reason: 'Already cashed out' });
      return;
    }
    if (state.multiplier >= state.crashAt) {
      socket.emit('cashout_failed', { reason: 'Too late, crashed' });
      return;
    }
    b.cashedOutAt = Number(state.multiplier.toFixed(2));
    state.bets.set(socket.id, b);
    const payout = +(b.amount * b.cashedOutAt).toFixed(2);
    socket.emit('cashed_out', { roundId: state.id, cashedAt: b.cashedOutAt, payout });
    io.emit('player_cashed', { socketId: socket.id, cashedAt: b.cashedOutAt, payout });
  });

  socket.on('disconnect', () => {
    console.log('desconectado:', socket.id);
  });
});

startBettingPhase();

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));