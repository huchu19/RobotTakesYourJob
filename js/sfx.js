/* ============================================================
   SFX — tiny WebAudio chiptune beeper.
   Sound-optional by design: everything routes through
   SFX.play(name); if muted or unsupported it silently no-ops.
   Starts muted (respectful default); toggled via the SND button.
   ============================================================ */

const SFX = (() => {
  let ctx = null;
  let muted = true;

  function ensureCtx() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    } catch (e) { ctx = null; }
    return ctx;
  }

  /* one square/tri blip */
  function blip(freq, dur, type = 'square', vol = 0.06, when = 0, slide = 0) {
    const c = ensureCtx();
    if (!c || muted) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, vol = 0.05, when = 0) {
    const c = ensureCtx();
    if (!c || muted) return;
    const t0 = c.currentTime + when;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    const gain = c.createGain();
    src.buffer = buf;
    gain.gain.setValueAtTime(vol, t0);
    src.connect(gain).connect(c.destination);
    src.start(t0);
  }

  /* named cues — the game's full sound vocabulary */
  const cues = {
    click:   () => { blip(880, 0.05, 'square', 0.04); },
    cash:    () => { blip(1180, 0.06, 'square', 0.045); blip(1560, 0.08, 'square', 0.04, 0.05); },
    buy:     () => { blip(520, 0.07); blip(660, 0.07, 'square', 0.06, 0.07); blip(880, 0.1, 'square', 0.06, 0.14); },
    upgrade: () => { blip(660, 0.06); blip(990, 0.09, 'square', 0.05, 0.06); },
    tab:     () => { blip(440, 0.04, 'square', 0.03); },
    error:   () => { blip(140, 0.15, 'sawtooth', 0.05); },
    warn:    () => { blip(311, 0.12, 'square', 0.05); blip(311, 0.12, 'square', 0.05, 0.18); },
    learn:   () => { /* the sad trombone of progress */
                     blip(392, 0.16, 'sawtooth', 0.06);
                     blip(370, 0.16, 'sawtooth', 0.06, 0.18);
                     blip(349, 0.16, 'sawtooth', 0.06, 0.36);
                     blip(311, 0.4,  'sawtooth', 0.07, 0.54, -60);
                     noise(0.25, 0.04, 0.54); },
    sabotage:() => { noise(0.3, 0.07); blip(180, 0.3, 'sawtooth', 0.06, 0.05, -120); },
    pip:     () => { blip(523, 0.1); blip(494, 0.1, 'square', 0.06, 0.12); blip(466, 0.3, 'square', 0.06, 0.24); },
    win:     () => { [523, 659, 784, 1047, 1319].forEach((f, i) => blip(f, 0.16, 'square', 0.06, i * 0.12)); },
    lose:    () => { [392, 311, 262, 196].forEach((f, i) => blip(f, 0.3, 'sawtooth', 0.06, i * 0.25)); },
  };

  return {
    play(name) {
      const cue = cues[name];
      if (cue) { try { cue(); } catch (e) { /* silence is acceptable */ } }
    },
    get muted() { return muted; },
    setMuted(m) {
      muted = m;
      if (!m) {
        const c = ensureCtx();
        if (c && c.state === 'suspended') c.resume();
      }
    },
  };
})();
