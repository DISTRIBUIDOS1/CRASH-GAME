/* client.js - controla UI y mueve el avión según el multiplicador */
const socket = io();

// UI referencias
const statusEl = document.getElementById('status');
const multiplierEl = document.getElementById('multiplier');
const roundInfoEl = document.getElementById('roundInfo');
const logEl = document.getElementById('log');
const betInput = document.getElementById('betAmount');
const betBtn = document.getElementById('betBtn');
const cashoutBtn = document.getElementById('cashoutBtn');
const planeEl = document.getElementById('plane');
const stage = document.getElementById('stage');

let clientId = null;
let currentRound = null;
let displayedMultiplier = 1.0;
let targetMultiplier = 1.0;
let animationRunning = false;

const DISPLAY_MAX = 10.0; 
const LERP = 0.12;        

function log(msg) {
  const d = new Date();
  const p = document.createElement('div');
  p.className = 'log-item';
  p.textContent = `[${d.toLocaleTimeString()}] ${msg}`;
  logEl.prepend(p);
}

// util: map valor (0..1) -> posición
function layoutPositions(mult) {
  const stageRect = stage.getBoundingClientRect();
  const planeRect = planeEl.getBoundingClientRect();
  const usableW = Math.max(1, stageRect.width - planeRect.width - 20);
  const usableH = Math.max(1, stageRect.height - planeRect.height - 100);

  // normalizar t en [0,1] según DISPLAY_MAX
  const t = Math.min(1, Math.max(0, (mult - 1) / (DISPLAY_MAX - 1)));

  // x: de izquierda a derecha
  const x = 12 + t * usableW;
  // y: de abajo hacia arriba (sube conforme t aumenta)
  const y = stageRect.height - planeRect.height - 16 - (t * usableH * 0.85);

  // rotación pequeña para dar sensación de ascenso
  const rot = -8 + t * 24; // de -8deg (leve bajada) a +16deg (ascenso)
  return { x, y, rot, t };
}

// animación por frame
function animate() {
  // acercar displayedMultiplier hacia targetMultiplier
  displayedMultiplier += (targetMultiplier - displayedMultiplier) * LERP;

  // si la diferencia es muy pequeña, ajusta exactamente
  if (Math.abs(displayedMultiplier - targetMultiplier) < 0.0001) {
    displayedMultiplier = targetMultiplier;
  }

  // actualizar HUD
  multiplierEl.textContent = 'x' + displayedMultiplier.toFixed(2);

  // mover avión
  const pos = layoutPositions(displayedMultiplier);
  planeEl.style.transform = `translate(${pos.x}px, ${pos.y}px) rotate(${pos.rot}deg)`;

  planeEl.style.filter = `drop-shadow(0 12px 18px rgba(0,0,0,0.6)) brightness(${1 + pos.t * 0.25})`;

  requestAnimationFrame(animate);
}

if (!animationRunning) {
  animationRunning = true;
  requestAnimationFrame(animate);
}

socket.on('connect', () => {
  clientId = socket.id;
  statusEl.textContent = 'Conectado • Esperando ronda...';
  log('Conectado al servidor con id: ' + clientId);
});

socket.on('welcome', data => {
  clientId = data.clientId;
  const cur = data.current;
  targetMultiplier = cur.multiplier || 1.0;
  displayedMultiplier = targetMultiplier;
  roundInfoEl.textContent = `Ronda: ${cur.roundId || '-'} • Estado: ${cur.status || '-'}`;
});

socket.on('round_start', d => {
  roundInfoEl.textContent = `Ronda: ${d.roundId} • Estado: betting`;
  targetMultiplier = 1.0;
  displayedMultiplier = 1.0;
  log(`Nueva ronda #${d.roundId} — ${d.bettingSeconds}s para apostar`);
});

socket.on('bet_countdown', d => {
  roundInfoEl.textContent = `Ronda: ${d.roundId} • Apostando — ${d.secondsLeft}s`;
});

socket.on('bet_locked', () => {
  roundInfoEl.textContent = 'Apuestas cerradas — Preparando vuelo';
});

socket.on('tick', d => {
  targetMultiplier = Number(d.multiplier) || targetMultiplier;
  roundInfoEl.textContent = `Ronda: ${d.roundId} • Estado: ${d.status}`;
});

socket.on('round_end', d => {
  targetMultiplier = Number(d.crashAt) || targetMultiplier;
  roundInfoEl.textContent = `Ronda: ${d.roundId} • Terminada (crash x${d.crashAt})`;
  log(`Ronda finalizada en x${d.crashAt}`);
  d.results.forEach(r => {
    log(`Jugador ${r.socketId} → apuesta ${r.amount} — cashout ${r.cashedAt || '-'} — payout ${r.payout}`);
  });

  planeEl.style.transition = 'transform 0.15s ease, filter 0.15s ease';
  setTimeout(()=> planeEl.style.transition = '', 300);
});

socket.on('bet_accepted', d => log(`Apuesta aceptada: ${d.amount}`));
socket.on('bet_rejected', d => log(`Apuesta rechazada: ${d.reason}`));
socket.on('cashed_out', d => log(`Cashed out en x${d.cashedAt} → pago ${d.payout}`));
socket.on('cashout_failed', d => log(`Cashout fallido: ${d.reason}`));
socket.on('bets_update', d => log(`Total apuestas activas: ${d.totalBets}`));

betBtn.onclick = () => {
  const amount = Number(betInput.value);
  if (!amount || amount <= 0) { log('Ingresa un monto válido'); return; }
  socket.emit('place_bet', { amount });
};

cashoutBtn.onclick = () => {
  socket.emit('cashout');
};
