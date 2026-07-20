// 8-bit Retro RPG sound synthesis using Web Audio API

class SoundManager {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playClick() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  }

  playCorrect() {
    try {
      this.init();
      if (!this.ctx) return;
      
      const playTone = (freq: number, delay: number, duration: number) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
        
        gain.gain.setValueAtTime(0, this.ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + delay + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + duration);
      };

      // Play major arpeggio
      playTone(523.25, 0, 0.15);     // C5
      playTone(659.25, 0.08, 0.15);  // E5
      playTone(783.99, 0.16, 0.15);  // G5
      playTone(1046.50, 0.24, 0.3);  // C6
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  }

  playDamage() {
    try {
      this.init();
      if (!this.ctx) return;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.35);
      
      // Distortion / noise-like effect using frequency modulation
      const modulator = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      modulator.frequency.setValueAtTime(45, this.ctx.currentTime);
      modGain.gain.setValueAtTime(80, this.ctx.currentTime);
      modulator.connect(modGain);
      modGain.connect(osc.frequency);
      
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      modulator.start();
      osc.start();
      
      modulator.stop(this.ctx.currentTime + 0.35);
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  }

  playShield() {
    try {
      this.init();
      if (!this.ctx) return;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.4);
      
      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  }

  playSpell() {
    try {
      this.init();
      if (!this.ctx) return;
      
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.4);
      
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.4);
      
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(this.ctx.currentTime + 0.4);
      osc2.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  }

  playGameOver(win: boolean) {
    try {
      this.init();
      if (!this.ctx) return;
      
      if (win) {
        // Winning victory melody
        const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 523.25]; // C4, E4, G4, C5, G4, C5
        const durs = [0.15, 0.15, 0.15, 0.15, 0.15, 0.55];
        let runningTime = 0;
        
        notes.forEach((freq, idx) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime + runningTime);
          
          gain.gain.setValueAtTime(0, this.ctx.currentTime + runningTime);
          gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + runningTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + runningTime + durs[idx]);
          
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(this.ctx.currentTime + runningTime);
          osc.stop(this.ctx.currentTime + runningTime + durs[idx]);
          
          runningTime += durs[idx] - 0.02;
        });
      } else {
        // Losing defeat melody
        const notes = [293.66, 277.18, 261.63, 196.00]; // D4, C#4, C4, G3
        const durs = [0.25, 0.25, 0.25, 0.8];
        let runningTime = 0;
        
        notes.forEach((freq, idx) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime + runningTime);
          
          gain.gain.setValueAtTime(0, this.ctx.currentTime + runningTime);
          gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + runningTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + runningTime + durs[idx]);
          
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(this.ctx.currentTime + runningTime);
          osc.stop(this.ctx.currentTime + runningTime + durs[idx]);
          
          runningTime += durs[idx] - 0.02;
        });
      }
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  }
}

export const sound = new SoundManager();
export default sound;
