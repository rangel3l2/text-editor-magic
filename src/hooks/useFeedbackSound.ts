import { useCallback } from "react";

type SoundType = "success" | "tip" | "warning" | "excellent" | "corrected";

// Sons usando a Web Audio API
const playSound = (frequency: number, duration: number = 100) => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  } catch (error) {
    console.warn("Audio playback not supported:", error);
  }
};

const soundFrequencies = {
  success: 800, // Sol (G5)
  tip: 600,     // Ré (D5)
  warning: 500, // Dó (C5)
  excellent: 900, // Lá (A5)
  corrected: 850, // Som intermediário para correções
};

export const useFeedbackSound = () => {
  const playFeedbackSound = useCallback((type: SoundType) => {
    const frequency = soundFrequencies[type];
    playSound(frequency, 150);
    
    // Para "excellent", toca uma sequência de notas
    if (type === "excellent") {
      setTimeout(() => playSound(frequency + 100, 150), 150);
      setTimeout(() => playSound(frequency + 200, 150), 300);
    }
  }, []);

  return { playFeedbackSound };
};
