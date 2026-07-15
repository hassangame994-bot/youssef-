// Web Audio API Synthesizer to play a premium chime notification
// This is robust, lightweight, and requires no external asset files!
export function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    
    // Play a delightful two-tone golden chime
    const playTone = (freq: number, start: number, duration: number, volume: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    };

    const now = ctx.currentTime;
    // Elegant arpeggio
    playTone(523.25, now, 0.6, 0.15);       // C5
    playTone(659.25, now + 0.08, 0.6, 0.15);  // E5
    playTone(783.99, now + 0.16, 0.8, 0.2);   // G5
    playTone(1046.50, now + 0.24, 1.2, 0.25); // C6
  } catch (err) {
    console.warn('Audio play blocked or unsupported by browser:', err);
  }
}

export function playStatusUpdateChime(success: boolean) {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    const playTone = (freq: number, start: number, duration: number, volume: number, type: 'sine' | 'triangle' = 'sine') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    if (success) {
      // Warm pleasant ascending double tone
      playTone(587.33, now, 0.2, 0.1);       // D5
      playTone(880.00, now + 0.08, 0.4, 0.15); // A5
    } else {
      // Soft descending flat double tone (warning/reject)
      playTone(349.23, now, 0.25, 0.1, 'triangle'); // F4
      playTone(293.66, now + 0.12, 0.4, 0.1, 'triangle'); // D4
    }
  } catch (err) {
    console.warn('Audio play blocked or unsupported by browser:', err);
  }
}
