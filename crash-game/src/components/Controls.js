import React, { useState } from 'react';
import './Controls.css';

const Controls = ({ onPlaceBet, onCashOut, status, currentBet, currentMultiplier }) => {
  const [inputBet, setInputBet] = useState(10);

  const handleBetChange = (e) => {
    setInputBet(Number(e.target.value));
  };

  const handlePlaceBetClick = () => {
    onPlaceBet(inputBet);
  };

  const handleCashOutClick = () => {
    onCashOut();
  };

  const calculateWinnings = () => {
    return (currentBet * currentMultiplier).toFixed(2);
  };

  return (
    <div className="controls-container">
      {status === 'waiting' && (
        <div className="bet-input">
          <label>Monto de la apuesta ($)</label>
          <input
            type="number"
            value={inputBet}
            onChange={handleBetChange}
            min="1"
            step="1"
          />
          <button onClick={handlePlaceBetClick}>Apostar</button>
        </div>
      )}

      {status === 'playing' && (
        <div className="game-info">
          <p>Apuesta actual: ${currentBet.toFixed(2)}</p>
          <p>Ganancias potenciales: ${calculateWinnings()}</p>
          <button onClick={handleCashOutClick}>
            Retirarse (x{currentMultiplier.toFixed(2)})
          </button>
        </div>
      )}

      {status === 'crashed' && (
        <p>¡Fin del juego! Realiza tu próxima apuesta.</p>
      )}
    </div>
  );
};

export default Controls;