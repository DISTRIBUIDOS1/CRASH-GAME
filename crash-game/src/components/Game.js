import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

const Game = ({ multiplier, status }) => {
  const gameRef = useRef(null);
  const appRef = useRef(null);
  const planeRef = useRef(null);
  const multiplierTextRef = useRef(null);
  const animationFrameId = useRef(null); // ID del requestAnimationFrame

  // useEffect para inicializar la aplicación de Pixi.js (se ejecuta solo una vez)
  useEffect(() => {
    const app = new PIXI.Application();
    appRef.current = app; // Guardar la instancia de la app en un ref

    async function initPixiElements() {
      await app.init({ width: 800, height: 400, backgroundColor: 0x1a2a3a });
      if (gameRef.current) {
        gameRef.current.appendChild(app.canvas);
      }

      // Cargar la textura del avión
      // Asegúrate de que tu imagen 'plane.png' esté en la carpeta 'public'
      const planeTexture = await PIXI.Assets.load('/plane.png');
      const planeSprite = new PIXI.Sprite(planeTexture);
      planeSprite.anchor.set(0.5); // Centrar el ancla
      planeSprite.x = 100; // Posición inicial
      planeSprite.y = 300; // Posición inicial
      planeSprite.scale.set(0.2); // Ajusta la escala si es necesario
      app.stage.addChild(planeSprite);
      planeRef.current = planeSprite; // Guardar el sprite del avión en un ref

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
      multiplierTextRef.current = multiplierText; // Guardar el texto en un ref

      // Iniciar el ticker de Pixi para renderizado continuo
      app.ticker.start();
    }

    initPixiElements();

    // Función de limpieza para destruir la aplicación de Pixi al desmontar el componente
    return () => {
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
      if (animationFrameId.current) { // Asegúrate de limpiar cualquier requestAnimationFrame pendiente
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []); // Dependencia vacía: se ejecuta solo una vez al montar

  // useEffect para controlar el movimiento del avión según el estado del juego
  useEffect(() => {
    if (!planeRef.current) return; // Asegurarse de que el avión ya esté cargado

    if (status === 'playing') {
      // Reiniciar la posición del avión al inicio del juego
      planeRef.current.x = 100;
      planeRef.current.y = 300;

      // Iniciar la animación
      const animatePlane = () => {
        if (planeRef.current && status === 'playing') { // Verifica el status aquí también
          planeRef.current.x += 0.2; // Velocidad horizontal
          planeRef.current.y -= 0.2; // Velocidad vertical (hacia arriba)
          animationFrameId.current = requestAnimationFrame(animatePlane);
        }
      };
      animationFrameId.current = requestAnimationFrame(animatePlane);

    } else if (status === 'crashed' || status === 'waiting') {
      // Detener la animación y resetear posición cuando el juego termina o espera
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      planeRef.current.x = 100; // Restablecer a la posición inicial
      planeRef.current.y = 300; // Restablecer a la posición inicial
    }
  }, [status]); // Este efecto se ejecuta cada vez que 'status' cambia

  // useEffect para actualizar el texto del multiplicador
  useEffect(() => {
    if (multiplierTextRef.current) {
      multiplierTextRef.current.text = `x${multiplier.toFixed(2)}`;
    }
  }, [multiplier]); // Este efecto se ejecuta cada vez que 'multiplier' cambia

  return <div ref={gameRef} className="game-container"></div>;
};

export default Game;