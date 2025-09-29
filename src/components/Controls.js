import React, { useState } from 'react';
import './Controls.css';

const Controls = ({ onPlaceBet, onCashOut, status, currentBet, currentMultiplier, betPlaced, countdown }) => {
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

  // Determinar si se puede apostar (solo en fase 'betting' y si no ha apostado)
  const isBettingOpen = status === 'betting' && !betPlaced;
  const isBettingActive = status === 'betting';
  const isCashingOut = status === 'running' && betPlaced;
  
  return (
    <div className="controls-container">
      
      {/* 1. SECCIÓN DE APUESTA (Siempre visible para el control) */}
      <div className="bet-input">
          {/* Muestra el contador si la fase es 'betting' */}
          {isBettingActive && <p>Tiempo para apostar: <strong>{countdown}s</strong></p>}
          
          <label>Monto de la apuesta ($)</label>
          <input
            type="number"
            value={inputBet}
            onChange={handleBetChange}
            min="1"
            step="1"
            // Desactiva si la apuesta ya está colocada o el juego está en fase running/ended
            disabled={!isBettingOpen}
          />
          <button 
            onClick={handlePlaceBetClick}
            // Desactiva el botón si la fase no es 'betting' o si ya apostó
            disabled={!isBettingOpen}
          >
            Apostar
          </button>
      </div>

      {/* 2. BOTÓN DE RETIRARSE */}
      {isCashingOut && (
        <div className="game-info">
          <p>Apuesta actual: ${currentBet.toFixed(2)}</p>
          <p>Ganancias potenciales: ${calculateWinnings()}</p>
          <button onClick={handleCashOutClick} className="cashout-button">
            Retirarse (x{currentMultiplier.toFixed(2)})
          </button>
        </div>
      )}

      {/* 3. MENSAJES DE ESTADO */}
      {(status === 'betting' && betPlaced) && (
        <p>Apuesta de ${currentBet.toFixed(2)} enviada. Esperando despegue...</p>
      )}

      {/* Muestra este mensaje si el juego terminó o está en fase no apta para apostar */}
      {(status === 'ended' || status === 'idle' || (status === 'running' && !betPlaced)) && (
          <p>Espera la fase de apuestas para colocar una nueva apuesta.</p>
      )}
    </div>
  );
};

export default Controls;