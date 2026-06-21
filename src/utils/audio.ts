/**
 * Premium Web Audio API Synthesizer for Pilates Class Session
 * Emulates a hand-hammered Tibetan Singing Bowl (for block transitions)
 * and a high-pitched brass Tingsha Chime (for block commencement).
 */

let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Synthesizes a deep, rich, vibrating Tibetan Singing Bowl gong.
 * Consists of a fundamental frequency, non-harmonic metal overtones,
 * slow low-frequency modulations (beating tremolo), and elegant lowpass filtering.
 */
export function playTibetanBowl() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Master container gain with organic attack and slow exponential decay
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.7, now + 0.15); // soft strike attack
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 9.0); // extremely long resonant decay

    // Lowpass filter to simulate the air damping higher overtones faster than the fundamental
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(110, now + 7.5);

    masterGain.connect(filter);
    filter.connect(ctx.destination);

    // Deep relaxing fundamental (approx E3/F3)
    const fundamental = 164.81; // E3

    // Ratios for Tibetan bowl partials (complex, slightly detuned metals)
    const partials = [
      { ratio: 1.0,  gain: 1.0,   detune: 0 },
      { ratio: 1.51, gain: 0.65,  detune: 2.1 }, // singing fifth and beating
      { ratio: 1.98, gain: 0.45,  detune: -1.5 },
      { ratio: 2.34, gain: 0.35,  detune: 3.2 }, // shimmering non-harmonic ring
      { ratio: 3.12, gain: 0.22,  detune: -4.5 },
      { ratio: 4.07, gain: 0.12,  detune: 5.0 },
      { ratio: 5.61, gain: 0.04,  detune: -6.0 }
    ];

    partials.forEach((p, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(fundamental * p.ratio, now);
      osc.detune.setValueAtTime(p.detune, now);

      // Create a gentle slow volume modulation (LFO) to synthesize the "beating" (shimmering vibrato/tremolo)
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      
      // Randomize LFO rate slightly per overtone to avoid rigid synchronization (natural chorus effect)
      lfo.frequency.setValueAtTime(2.0 + (idx * 0.4) + Math.random() * 0.3, now);
      lfoGain.gain.setValueAtTime(p.gain * 0.2, now); // depth of volume beating

      lfo.connect(lfoGain);
      lfoGain.connect(oscGain.gain);

      // Set base proportional volume of this overtone
      oscGain.gain.setValueAtTime(p.gain * 0.3, now);

      osc.connect(oscGain);
      oscGain.connect(masterGain);

      osc.start(now);
      lfo.start(now);

      // Self-cleaning nodes
      osc.stop(now + 9.5);
      lfo.stop(now + 9.5);
    });
  } catch (error) {
    console.error("[Audio Engine] Error playing Tibetan Bowl synthesis:", error);
  }
}

/**
 * Synthesizes a bright, pure, ringing Tingsha Chime.
 * Excellent for marking the end of a transition and the active start of a work cycle.
 */
export function playTingshaChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.55, now + 0.015); // sharp strike
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 5.0); // pure ringer decay

    // Highpass filter to isolate the crystalline bell frequency range
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(500, now);

    masterGain.connect(filter);
    filter.connect(ctx.destination);

    // Beautiful pure brass tone (approx D6)
    const fundamental = 1174.66; // D6

    const partials = [
      { ratio: 1.0,  gain: 1.0,   detune: 0 },
      { ratio: 1.49, gain: 0.45,  detune: 1.8 },
      { ratio: 1.99, gain: 0.25,  detune: -1.0 },
      { ratio: 2.51, gain: 0.12,  detune: 2.4 }
    ];

    partials.forEach((p) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(fundamental * p.ratio, now);
      osc.detune.setValueAtTime(p.detune, now);

      oscGain.gain.setValueAtTime(p.gain * 0.25, now);

      osc.connect(oscGain);
      oscGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 5.5);
    });
  } catch (error) {
    console.error("[Audio Engine] Error playing Tingsha Chime synthesis:", error);
  }
}
