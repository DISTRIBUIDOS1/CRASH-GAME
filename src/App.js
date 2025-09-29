import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Game from './components/Game';
import Controls from './components/Controls';
import './App.css';

const SERVER_URL = 'http://localhost:4000'; 

function App() {
  const [socket, setSocket] = useState(null);
  const [multiplier, setMultiplier] = useState(1.0);
  const [gameStatus, setGameStatus] = useState('idle'); 
  const [message, setMessage] = useState('Conectando...');
  const [betAmount, setBetAmount] = useState(0);
  const [betPlaced, setBetPlaced] = useState(false); 
  const [countdownSeconds, setCountdownSeconds] = useState(0); 

  useEffect(() => {
    // 1. Conexión
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    // 2. Manejo de eventos del servidor
    newSocket.on('connect', () => {
      setMessage('Conectado al servidor.');
    });

    newSocket.on('welcome', (data) => {
        setGameStatus(data.current.status);
        setMultiplier(data.current.multiplier);
        setMessage(`Bienvenido. Estado actual: ${data.current.status}`);
    });
    
    newSocket.on('round_start', (data) => {
        setGameStatus('betting');
        setMultiplier(1.0);
        setBetPlaced(false);
        setBetAmount(0);
        setMessage(`¡Nueva ronda! Tienes ${data.bettingSeconds}s para apostar.`);
        setCountdownSeconds(data.bettingSeconds);
    });
    
    newSocket.on('bet_countdown', (data) => {
        setCountdownSeconds(data.secondsLeft);
    });

    newSocket.on('tick', (data) => {
        setGameStatus(data.status);
        setMultiplier(data.multiplier);
    });

    newSocket.on('round_end', (data) => {
        setGameStatus('ended');
        setMultiplier(data.crashAt); 
        setMessage(`¡El avión se estrelló en x${data.crashAt.toFixed(2)}!`);

        const playerResult = data.results.find(r => r.socketId === newSocket.id);
        
        if (playerResult) {
            if (playerResult.payout > 0) {
                // Mensaje de GANANCIA
                setMessage(m => m + ` Ganaste: $${playerResult.payout.toFixed(2)}`);
            } else if (playerResult.cashedAt === null) {
                // Mensaje de PÉRDIDA EXPLÍCITO
                setMessage('¡Oh no, la apuesta ha fallado! Has perdido. 😟');
            }
        }
    });

    newSocket.on('bet_accepted', (data) => {
        setBetPlaced(true);
        setMessage(`Apuesta de $${data.amount.toFixed(2)} aceptada. Esperando el vuelo.`);
    });
    
    newSocket.on('bet_rejected', (data) => {
        setBetPlaced(false);
        setMessage(`Apuesta rechazada: ${data.reason}`);
    });
    
    newSocket.on('cashed_out', (data) => {
        setBetPlaced(false); 
        setMessage(`¡Retiro exitoso en x${data.cashedAt.toFixed(2)}! Payout: $${data.payout.toFixed(2)}`);
    });

    newSocket.on('bet_locked', () => {
        setMessage('Apuestas cerradas. ¡Despegando!');
    });


    return () => newSocket.close();
  }, []); 

  const handlePlaceBet = (amount) => {
    if (socket && gameStatus === 'betting' && !betPlaced && amount > 0) {
      setBetAmount(amount);
      socket.emit('place_bet', { amount });
    }
  };

  const handleCashOut = () => {
    if (socket && gameStatus === 'running' && betPlaced) {
      socket.emit('cashout');
    }
  };

  return (
    <div className="App">
      <h1>Juego del Avión ✈️</h1>
      <p className="status-message">{message}</p>
      <Game multiplier={multiplier} status={gameStatus} />
      <Controls
        onPlaceBet={handlePlaceBet}
        onCashOut={handleCashOut}
        status={gameStatus}
        currentBet={betAmount}
        currentMultiplier={multiplier}
        betPlaced={betPlaced}
        countdown={countdownSeconds} 
      />
    </div>
  );
}

export default App;