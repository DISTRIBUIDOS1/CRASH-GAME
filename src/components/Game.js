import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

const Game = ({ multiplier, status }) => {
  const gameRef = useRef(null);
  const appRef = useRef(null);
  const multiplierTextRef = useRef(null);
  const planeRef = useRef(null);
  
  // Guardamos la posición inicial para el reseteo
  const START_X = 100;
  const START_Y = 300;

  // 1. Inicializa la aplicación de Pixi.js (corre una sola vez)
  useEffect(() => {
    const app = new PIXI.Application();
    appRef.current = app;

    async function initPixiElements() {
      await app.init({ width: 800, height: 400, backgroundColor: 0x1a2a3a });
      if (gameRef.current) {
        gameRef.current.appendChild(app.canvas);
      }

      // Cargar la textura del avión
      // Nota: Aquí se usará la imagen 'plane.png' que pusiste en la carpeta public
      const planeTexture = await PIXI.Assets.load('/plane.png');
      const planeSprite = new PIXI.Sprite(planeTexture);
      planeSprite.anchor.set(0.5); 
      planeSprite.x = START_X; 
      planeSprite.y = START_Y; 
      planeSprite.scale.set(0.2); 
      app.stage.addChild(planeSprite);
      planeRef.current = planeSprite; 
      
      // Configurar y agregar el texto del multiplicador
      const style = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: 50,
        fill: '#ffffff',
        fontWeight: 'bold',
        dropShadow: true,
        dropShadowColor: '#000000',
        dropShadowBlur: 4,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 6,
      });

      const multiplierText = new PIXI.Text({ text: 'x1.00', style });
      multiplierText.anchor.set(0.5);
      multiplierText.x = app.canvas.width / 2;
      multiplierText.y = app.canvas.height / 2;
      app.stage.addChild(multiplierText);
      multiplierTextRef.current = multiplierText; 

      // Iniciar el ticker de Pixi para renderizado continuo
      app.ticker.start();
    }

    initPixiElements();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true);
      }
    };
  }, []); 

  // 2. Controla el movimiento del avión basado en el multiplicador y el estado
  useEffect(() => {
    if (planeRef.current) {
      if (status === 'running') {
        // Mueve el avión basándose en el valor del multiplicador del servidor
        // Ajusta el factor (2.5) para cambiar la distancia que recorre
        const moveFactor = multiplier * 2.5; 
        planeRef.current.x = START_X + moveFactor;
        planeRef.current.y = START_Y - moveFactor;

      } else if (status === 'betting' || status === 'ended' || status === 'idle') {
        // Restablece la posición al inicio
        planeRef.current.x = START_X;
        planeRef.current.y = START_Y;
      }
    }
  }, [multiplier, status]); // Se actualiza con cada 'tick' del servidor

  // 3. Actualiza el texto del multiplicador
  useEffect(() => {
    if (multiplierTextRef.current) {
      multiplierTextRef.current.text = `x${multiplier.toFixed(2)}`;
    }
  }, [multiplier]); 

  return <div ref={gameRef} className="game-container"></div>;
};

export default Game;