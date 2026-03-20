class AudioEngine {
  private ctx: AudioContext | null = null;
  private musicNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
  private musicTimeout: ReturnType<typeof setTimeout> | null = null;
  private musicPlaying = false;
  private enabled = false;

  private getCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (!on) this.stopBackground();
  }

  isEnabled() {
    return this.enabled;
  }

  playTap() {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }

  playWordFound() {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const notes = [523, 659, 784];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        gain.gain.linearRampToValueAtTime(
          0.2,
          ctx.currentTime + i * 0.12 + 0.04,
        );
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + i * 0.12 + 0.14,
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.15);
      });
    } catch {}
  }

  playLevelComplete() {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const notes = [523, 659, 784, 1047, 1319];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
        gain.gain.linearRampToValueAtTime(
          0.25,
          ctx.currentTime + i * 0.18 + 0.06,
        );
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + i * 0.18 + 0.22,
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.18);
        osc.stop(ctx.currentTime + i * 0.18 + 0.25);
      });
    } catch {}
  }

  playHint() {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const notes = [880, 660];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + i * 0.07 + 0.07,
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.07);
        osc.stop(ctx.currentTime + i * 0.07 + 0.08);
      });
    } catch {}
  }

  playBackground(start: boolean) {
    if (start) {
      this.musicPlaying = true;
      this.scheduleLoop();
    } else {
      this.stopBackground();
    }
  }

  private stopBackground() {
    this.musicPlaying = false;
    if (this.musicTimeout) clearTimeout(this.musicTimeout);
    for (const n of this.musicNodes) {
      try {
        n.gain.gain.exponentialRampToValueAtTime(
          0.001,
          (this.ctx?.currentTime ?? 0) + 0.1,
        );
      } catch {}
      try {
        n.osc.stop();
      } catch {}
    }
    this.musicNodes = [];
  }

  private scheduleLoop() {
    if (!this.musicPlaying || !this.enabled) return;
    try {
      const ctx = this.getCtx();
      // Simple pentatonic loop
      const melody = [523, 587, 659, 784, 880, 784, 659, 587];
      const duration = 0.28;
      melody.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * duration);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * duration);
        gain.gain.linearRampToValueAtTime(
          0.07,
          ctx.currentTime + i * duration + 0.06,
        );
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + i * duration + duration - 0.02,
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * duration);
        osc.stop(ctx.currentTime + i * duration + duration);
        this.musicNodes.push({ osc, gain });
      });
      const loopDuration = melody.length * duration * 1000;
      this.musicTimeout = setTimeout(() => {
        this.musicNodes = [];
        this.scheduleLoop();
      }, loopDuration);
    } catch {}
  }
}

export const audioEngine = new AudioEngine();
