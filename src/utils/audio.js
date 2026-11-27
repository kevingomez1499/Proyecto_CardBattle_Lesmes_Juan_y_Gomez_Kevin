import { asset } from './assets.js';

let muted = false;
export const setMuted = (value) => { muted = value; };
export const isMuted = () => muted;

// Reproduce un sonido. Si el navegador lo bloquea o falta el archivo, no rompe el juego.
export function playSound(path) {
  if (muted || !path) return;
  try {
    const audio = new Audio(asset(path));
    audio.volume = 0.6;
    audio.play().catch(() => {});
  } catch {
    /* sin audio */
  }
}

export const SOUNDS = {
  victory: 'sounds/victory.mp3',
  defeat: 'sounds/defeat.mp3',
  enter: 'sounds/enter.mp3',
  critical: 'sounds/critical.wav', // [EXAMEN] golpe crítico
  dodge: 'sounds/dodge.wav', // [EXAMEN] ataque esquivado
};
