import React, { useState, useEffect } from 'react';
import Game from './components/Game';
import Controls from './components/Controls';
import './App.css';

function App() {
  const [multiplier, setMultiplier] = useState(1);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [message, setMessage] = useState('');
  const [betAmount, setBetAmount] = useState(0);

  useEffect(() => {
    let timer;
    let crashTimer;

    if (gameStatus === 'playing') {
      let currentMultiplier = 1;
      timer = setInterval(() => {
        currentMultiplier += 0.01; // Velocidad de aumento del multiplicador
        setMultiplier(currentMultiplier);
      }, 100); // Actualiza cada 100ms

      const crashPoint = Math.random() * 40 + 10; // El avión se estrellará entre x10 y x50
      crashTimer = setTimeout(() => {
        clearInterval(timer);
        setGameStatus('crashed');
        setMessage(`¡El avión se estrelló en x${currentMultiplier.toFixed(2)}!`);
        setMultiplier(1); // Reinicia el multiplicador para la próxima ronda
      }, crashPoint * 1000); // Tiempo hasta el choque
    }

    return () => {
      clearInterval(timer);
      clearTimeout(crashTimer);
    };
  }, [gameStatus]);

  const handlePlaceBet = (amount) => {
    if (gameStatus === 'waiting' && amount > 0) {
      setBetAmount(amount);
      setGameStatus('playing');
      setMessage('¡Juego en curso!');
      setMultiplier(1); // Asegúrate de que el multiplicador empiece en 1.00
    } else {
      setMessage('Espera a que termine el juego actual o ingresa una apuesta válida.');
    }
  };

  const handleCashOut = () => {
    if (gameStatus === 'playing') {
      const finalWinnings = (betAmount * multiplier).toFixed(2);
      setGameStatus('crashed');
      setMessage(`¡Te has retirado en x${multiplier.toFixed(2)}! Ganaste $${finalWinnings}.`);
      setMultiplier(1); // Reinicia el multiplicador
    }
  };

  return (
    <div className="App">
      <h1>Juego del Avión ✈️</h1>
      <p>{message}</p>
      <Game multiplier={multiplier} status={gameStatus} />
      <Controls
        onPlaceBet={handlePlaceBet}
        onCashOut={handleCashOut}
        status={gameStatus}
        currentBet={betAmount}
        currentMultiplier={multiplier}
      />
    </div>
  );
}

export default App;