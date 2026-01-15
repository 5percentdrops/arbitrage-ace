import { useCallback, useRef } from 'react';

// Web Audio API-based notification sound
export function useAlertSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastPlayedRef = useRef<number>(0);

  const playAlertSound = useCallback(() => {
    // Debounce: don't play more than once per second
    const now = Date.now();
    if (now - lastPlayedRef.current < 1000) return;
    lastPlayedRef.current = now;

    try {
      // Create or reuse AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      
      // Resume if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now_time = ctx.currentTime;

      // Create a pleasant two-tone notification sound
      // First tone (higher)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.setValueAtTime(880, now_time); // A5
      osc1.type = 'sine';
      gain1.gain.setValueAtTime(0.3, now_time);
      gain1.gain.exponentialRampToValueAtTime(0.01, now_time + 0.15);
      osc1.start(now_time);
      osc1.stop(now_time + 0.15);

      // Second tone (even higher, slight delay)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.setValueAtTime(1108.73, now_time + 0.1); // C#6
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0, now_time);
      gain2.gain.setValueAtTime(0.3, now_time + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.01, now_time + 0.3);
      osc2.start(now_time + 0.1);
      osc2.stop(now_time + 0.3);

    } catch (err) {
      console.warn('Could not play alert sound:', err);
    }
  }, []);

  return { playAlertSound };
}
