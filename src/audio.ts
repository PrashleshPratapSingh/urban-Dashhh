import { createRef } from 'react';

export const audioContextRef = createRef<AudioContext>();

export const playSound = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
  if (!window.AudioContext && !(window as any).webkitAudioContext) return;
  
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio bias failure', e);
  }
};

export const playJumpSound = () => playSound(440, 0.1, 'square');
export const playCoinSound = () => playSound(880, 0.1, 'sine');
export const playGemSound = () => playSound(1200, 0.1, 'sine');
export const playTokenSound = () => playSound(600, 0.2, 'triangle');
export const playHitSound = () => playSound(110, 0.3, 'sawtooth');
