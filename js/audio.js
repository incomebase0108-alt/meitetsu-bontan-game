// Web Audio APIによるチップチューン風効果音 + BGM
// 外部ファイル不要、すべて合成。ドラム/ベース/リード/アルペジオの4声構成。
window.Audio8 = (function() {
  let ctx = null;
  let masterGain = null;
  let bgmController = null;
  let muted = false;

  function init() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.22;
    masterGain.connect(ctx.destination);
    return ctx;
  }

  function resumeIfSuspended() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function beep(freq, duration, type = 'square', volume = 0.3, when = 0) {
    if (muted || !ctx) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(volume, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  function sweep(f1, f2, duration, type = 'square', volume = 0.3, when = 0) {
    if (muted || !ctx) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f1, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + duration);
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(volume, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  function noise(duration, freq = 200, volume = 0.3, when = 0) {
    if (muted || !ctx) return;
    const t = ctx.currentTime + when;
    const bufSize = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2);
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = 'lowpass';
    filter.frequency.value = freq;
    gain.gain.value = volume;
    src.buffer = buf;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    src.start(t);
  }

  // ドラム音
  function kick(when = 0) {
    if (muted || !ctx) return;
    sweep(120, 40, 0.18, 'sine', 0.45, when);
    noise(0.04, 200, 0.15, when);
  }
  function snare(when = 0) {
    noise(0.12, 1200, 0.25, when);
    beep(220, 0.05, 'triangle', 0.15, when);
  }
  function hat(when = 0) {
    noise(0.04, 8000, 0.1, when);
  }

  // 効果音群（拡張）
  const SFX = {
    punch:   () => { init(); resumeIfSuspended(); noise(0.08, 400, 0.4); beep(180, 0.05, 'square', 0.2); },
    kick:    () => { init(); resumeIfSuspended(); noise(0.15, 250, 0.5); sweep(180, 80, 0.18, 'sawtooth', 0.3); },
    special: () => {
      init(); resumeIfSuspended();
      sweep(800, 200, 0.45, 'sawtooth', 0.4);
      noise(0.3, 100, 0.4);
      // 派手な追い打ち
      [880, 1320, 1760].forEach((f, i) => beep(f, 0.08, 'square', 0.25, 0.05 + i * 0.06));
    },
    dash:    () => {
      init(); resumeIfSuspended();
      sweep(120, 600, 0.18, 'sawtooth', 0.3);
      noise(0.2, 1000, 0.25);
    },
    throw:   () => {
      init(); resumeIfSuspended();
      sweep(400, 80, 0.3, 'square', 0.35);
      setTimeout(() => { noise(0.18, 200, 0.5); kick(); }, 250);
    },
    guard:   () => { init(); resumeIfSuspended(); beep(440, 0.1, 'triangle', 0.25); beep(330, 0.1, 'triangle', 0.2, 0.05); },
    guardBreak: () => {
      init(); resumeIfSuspended();
      sweep(800, 100, 0.4, 'square', 0.4);
      noise(0.3, 2000, 0.4);
    },
    hit:     () => { init(); resumeIfSuspended(); noise(0.1, 600, 0.5); },
    critical:() => {
      init(); resumeIfSuspended();
      noise(0.15, 2000, 0.5);
      beep(1200, 0.15, 'square', 0.3);
      beep(800, 0.15, 'square', 0.3, 0.05);
    },
    miss:    () => { init(); resumeIfSuspended(); sweep(300, 100, 0.15, 'square', 0.15); },
    combo:   (n = 1) => {
      init(); resumeIfSuspended();
      const f = 440 + n * 80;
      beep(f, 0.08, 'square', 0.2);
      beep(f * 1.5, 0.06, 'square', 0.15, 0.04);
    },
    victory: () => {
      init(); resumeIfSuspended();
      [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.18, 'square', 0.3, i * 0.1));
      [523/2, 659/2, 784/2, 1047/2].forEach((f, i) => beep(f, 0.18, 'triangle', 0.2, i * 0.1));
    },
    defeat:  () => {
      init(); resumeIfSuspended();
      [400, 300, 200, 100].forEach((f, i) => beep(f, 0.25, 'sawtooth', 0.3, i * 0.15));
    },
    bontan:  () => {
      init(); resumeIfSuspended();
      [659, 880, 1320].forEach((f, i) => beep(f, 0.12, 'square', 0.3, i * 0.08));
      sweep(220, 880, 0.5, 'triangle', 0.25, 0.3);
    },
    train:   () => {
      init(); resumeIfSuspended();
      [880, 880, 880].forEach((f, i) => beep(f, 0.1, 'sine', 0.25, i * 0.15));
      for (let i = 0; i < 6; i++) {
        noise(0.05, 150, 0.2, 0.5 + i * 0.12);
        beep(100, 0.05, 'sine', 0.15, 0.5 + i * 0.12);
      }
    },
    menu:    () => { init(); resumeIfSuspended(); beep(660, 0.05, 'square', 0.2); },
    levelup: () => {
      init(); resumeIfSuspended();
      [523, 659, 784, 1047, 1319].forEach((f, i) => beep(f, 0.1, 'square', 0.3, i * 0.07));
    },
    final:   () => {
      init(); resumeIfSuspended();
      sweep(50, 800, 1.5, 'sawtooth', 0.4);
      noise(0.3, 80, 0.5, 1.5);
    }
  };

  // BGMトラック定義（各トラックは小節パターンの配列）
  // 16分音符グリッド。step 0-15で1小節、4小節ループ
  const TRACKS = {
    title: {
      bpm: 110,
      bars: 4,
      // ノートは [step, freq, dur, type, vol]
      lead: [
        [0, 659, 0.4, 'square', 0.1], [4, 784, 0.4, 'square', 0.1],
        [8, 880, 0.8, 'square', 0.1], [16, 784, 0.4, 'square', 0.1],
        [20, 659, 0.4, 'square', 0.1], [24, 587, 0.8, 'square', 0.1],
        [32, 523, 0.4, 'square', 0.1], [36, 587, 0.4, 'square', 0.1],
        [40, 659, 1.2, 'square', 0.1], [56, 880, 0.4, 'square', 0.1]
      ],
      bass: [
        [0, 165, 0.5, 'triangle', 0.13], [8, 196, 0.5, 'triangle', 0.13],
        [16, 220, 0.5, 'triangle', 0.13], [24, 165, 0.5, 'triangle', 0.13],
        [32, 130, 0.5, 'triangle', 0.13], [40, 165, 0.5, 'triangle', 0.13],
        [48, 196, 0.5, 'triangle', 0.13], [56, 220, 0.5, 'triangle', 0.13]
      ],
      drums: [
        [0, 'k'], [8, 'k'], [16, 'k'], [24, 'k'],
        [32, 'k'], [40, 'k'], [48, 'k'], [56, 'k'],
        [4, 's'], [12, 's'], [20, 's'], [28, 's'],
        [36, 's'], [44, 's'], [52, 's'], [60, 's']
      ]
    },
    map: {
      bpm: 120,
      bars: 4,
      // 名鉄っぽい明るい和風メロ
      lead: [
        [0, 523, 0.25, 'square', 0.1], [2, 587, 0.25, 'square', 0.1],
        [4, 659, 0.25, 'square', 0.1], [6, 784, 0.25, 'square', 0.1],
        [8, 880, 0.5, 'square', 0.1], [12, 784, 0.25, 'square', 0.1],
        [14, 659, 0.25, 'square', 0.1],
        [16, 587, 0.25, 'square', 0.1], [18, 659, 0.25, 'square', 0.1],
        [20, 784, 0.25, 'square', 0.1], [22, 1047, 0.25, 'square', 0.1],
        [24, 880, 0.5, 'square', 0.1], [28, 784, 0.5, 'square', 0.1],
        [32, 659, 0.25, 'square', 0.1], [34, 587, 0.25, 'square', 0.1],
        [36, 659, 0.25, 'square', 0.1], [38, 784, 0.25, 'square', 0.1],
        [40, 880, 0.5, 'square', 0.1], [44, 784, 0.5, 'square', 0.1],
        [48, 659, 0.25, 'square', 0.1], [50, 587, 0.25, 'square', 0.1],
        [52, 523, 0.5, 'square', 0.1], [56, 587, 0.25, 'square', 0.1],
        [58, 659, 0.25, 'square', 0.1], [60, 523, 1.0, 'square', 0.1]
      ],
      bass: [
        [0, 131, 0.5, 'triangle', 0.13], [4, 131, 0.5, 'triangle', 0.13],
        [8, 175, 0.5, 'triangle', 0.13], [12, 175, 0.5, 'triangle', 0.13],
        [16, 196, 0.5, 'triangle', 0.13], [20, 196, 0.5, 'triangle', 0.13],
        [24, 175, 0.5, 'triangle', 0.13], [28, 175, 0.5, 'triangle', 0.13],
        [32, 131, 0.5, 'triangle', 0.13], [36, 131, 0.5, 'triangle', 0.13],
        [40, 165, 0.5, 'triangle', 0.13], [44, 165, 0.5, 'triangle', 0.13],
        [48, 175, 0.5, 'triangle', 0.13], [52, 175, 0.5, 'triangle', 0.13],
        [56, 196, 0.5, 'triangle', 0.13], [60, 131, 0.5, 'triangle', 0.13]
      ],
      drums: [
        [0, 'k'], [4, 's'], [8, 'k'], [12, 's'],
        [16, 'k'], [20, 's'], [24, 'k'], [28, 's'],
        [32, 'k'], [36, 's'], [40, 'k'], [44, 's'],
        [48, 'k'], [52, 's'], [56, 'k'], [60, 's'],
        [2, 'h'], [6, 'h'], [10, 'h'], [14, 'h'],
        [18, 'h'], [22, 'h'], [26, 'h'], [30, 'h'],
        [34, 'h'], [38, 'h'], [42, 'h'], [46, 'h'],
        [50, 'h'], [54, 'h'], [58, 'h'], [62, 'h']
      ]
    },
    battle: {
      bpm: 150,
      bars: 4,
      // 激しめのチップチューン
      lead: [
        [0, 392, 0.13, 'square', 0.12], [2, 466, 0.13, 'square', 0.12],
        [4, 523, 0.13, 'square', 0.12], [6, 466, 0.13, 'square', 0.12],
        [8, 392, 0.13, 'square', 0.12], [10, 466, 0.13, 'square', 0.12],
        [12, 523, 0.13, 'square', 0.12], [14, 622, 0.25, 'square', 0.12],
        [16, 523, 0.13, 'square', 0.12], [18, 466, 0.13, 'square', 0.12],
        [20, 392, 0.13, 'square', 0.12], [22, 466, 0.13, 'square', 0.12],
        [24, 523, 0.25, 'square', 0.12], [28, 392, 0.25, 'square', 0.12],
        [32, 392, 0.13, 'square', 0.12], [34, 466, 0.13, 'square', 0.12],
        [36, 523, 0.13, 'square', 0.12], [38, 622, 0.13, 'square', 0.12],
        [40, 698, 0.25, 'square', 0.12], [44, 622, 0.25, 'square', 0.12],
        [48, 523, 0.13, 'square', 0.12], [50, 466, 0.13, 'square', 0.12],
        [52, 392, 0.13, 'square', 0.12], [54, 349, 0.13, 'square', 0.12],
        [56, 311, 0.13, 'square', 0.12], [58, 349, 0.13, 'square', 0.12],
        [60, 392, 0.5, 'square', 0.12]
      ],
      bass: [
        [0, 98, 0.25, 'sawtooth', 0.13], [2, 98, 0.25, 'sawtooth', 0.13],
        [4, 98, 0.25, 'sawtooth', 0.13], [6, 98, 0.25, 'sawtooth', 0.13],
        [8, 117, 0.25, 'sawtooth', 0.13], [10, 117, 0.25, 'sawtooth', 0.13],
        [12, 117, 0.25, 'sawtooth', 0.13], [14, 117, 0.25, 'sawtooth', 0.13],
        [16, 131, 0.25, 'sawtooth', 0.13], [18, 131, 0.25, 'sawtooth', 0.13],
        [20, 131, 0.25, 'sawtooth', 0.13], [22, 131, 0.25, 'sawtooth', 0.13],
        [24, 98, 0.25, 'sawtooth', 0.13], [26, 98, 0.25, 'sawtooth', 0.13],
        [28, 98, 0.25, 'sawtooth', 0.13], [30, 98, 0.25, 'sawtooth', 0.13],
        [32, 98, 0.25, 'sawtooth', 0.13], [34, 98, 0.25, 'sawtooth', 0.13],
        [36, 98, 0.25, 'sawtooth', 0.13], [38, 98, 0.25, 'sawtooth', 0.13],
        [40, 117, 0.25, 'sawtooth', 0.13], [42, 117, 0.25, 'sawtooth', 0.13],
        [44, 117, 0.25, 'sawtooth', 0.13], [46, 117, 0.25, 'sawtooth', 0.13],
        [48, 87, 0.25, 'sawtooth', 0.13], [50, 87, 0.25, 'sawtooth', 0.13],
        [52, 87, 0.25, 'sawtooth', 0.13], [54, 87, 0.25, 'sawtooth', 0.13],
        [56, 98, 0.25, 'sawtooth', 0.13], [58, 98, 0.25, 'sawtooth', 0.13],
        [60, 98, 0.5, 'sawtooth', 0.13]
      ],
      drums: [
        [0, 'k'], [4, 's'], [6, 'k'], [8, 'k'], [12, 's'],
        [16, 'k'], [20, 's'], [22, 'k'], [24, 'k'], [28, 's'],
        [32, 'k'], [36, 's'], [38, 'k'], [40, 'k'], [44, 's'],
        [48, 'k'], [52, 's'], [54, 'k'], [56, 'k'], [60, 's'],
        // ハイハット8分
        [2, 'h'], [10, 'h'], [14, 'h'], [18, 'h'], [26, 'h'], [30, 'h'],
        [34, 'h'], [42, 'h'], [46, 'h'], [50, 'h'], [58, 'h'], [62, 'h']
      ]
    },
    boss: {
      bpm: 140,
      bars: 4,
      // 重厚なボス戦
      lead: [
        [0, 311, 0.5, 'sawtooth', 0.1], [4, 415, 0.5, 'sawtooth', 0.1],
        [8, 466, 0.5, 'sawtooth', 0.1], [12, 415, 0.5, 'sawtooth', 0.1],
        [16, 311, 0.5, 'sawtooth', 0.1], [20, 277, 0.5, 'sawtooth', 0.1],
        [24, 233, 1.0, 'sawtooth', 0.1],
        [32, 311, 0.25, 'sawtooth', 0.1], [34, 415, 0.25, 'sawtooth', 0.1],
        [36, 466, 0.25, 'sawtooth', 0.1], [38, 622, 0.25, 'sawtooth', 0.1],
        [40, 466, 0.5, 'sawtooth', 0.1], [44, 415, 0.5, 'sawtooth', 0.1],
        [48, 311, 0.5, 'sawtooth', 0.1], [52, 233, 0.5, 'sawtooth', 0.1],
        [56, 311, 1.0, 'sawtooth', 0.1]
      ],
      bass: [
        [0, 78, 0.5, 'square', 0.15], [4, 78, 0.5, 'square', 0.15],
        [8, 87, 0.5, 'square', 0.15], [12, 87, 0.5, 'square', 0.15],
        [16, 78, 0.5, 'square', 0.15], [20, 78, 0.5, 'square', 0.15],
        [24, 69, 0.5, 'square', 0.15], [28, 69, 0.5, 'square', 0.15],
        [32, 78, 0.5, 'square', 0.15], [36, 78, 0.5, 'square', 0.15],
        [40, 87, 0.5, 'square', 0.15], [44, 87, 0.5, 'square', 0.15],
        [48, 78, 0.5, 'square', 0.15], [52, 58, 0.5, 'square', 0.15],
        [56, 78, 1.0, 'square', 0.15]
      ],
      drums: [
        [0, 'k'], [2, 'k'], [4, 's'], [6, 'k'],
        [8, 'k'], [12, 's'], [14, 'k'],
        [16, 'k'], [18, 'k'], [20, 's'], [22, 'k'],
        [24, 'k'], [28, 's'], [30, 'k'],
        [32, 'k'], [34, 'k'], [36, 's'], [38, 'k'],
        [40, 'k'], [44, 's'], [46, 'k'],
        [48, 'k'], [50, 'k'], [52, 's'], [54, 'k'],
        [56, 'k'], [60, 's'], [62, 'k']
      ]
    }
  };

  // 単車エンジン（持続音・旧車會の甲高い「パラパラ」）。
  // startEngine() → { stop(), setPitch(mult) }。setPitch で接近=高/通過後=低のドップラー表現。
  function startEngine() {
    init(); resumeIfSuspended();
    if (muted || !ctx) return { stop() {}, setPitch() {} };
    const t0 = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.value = 0;
    out.gain.linearRampToValueAtTime(0.13, t0 + 0.25);   // フェードイン
    out.connect(masterGain);

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 1.2;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2600;
    bp.connect(lp); lp.connect(out);

    const base = [124, 125.6, 62];                       // 2本のノコギリ＋サブ
    const types = ['sawtooth', 'sawtooth', 'square'];
    const oscs = base.map((f, i) => {
      const o = ctx.createOscillator();
      o.type = types[i]; o.frequency.value = f;
      o.connect(bp); o.start(t0);
      return o;
    });

    // チャグ（パラパラ）: 速いトレモロでエンジンの脈動
    const lfo = ctx.createOscillator();
    lfo.type = 'sawtooth'; lfo.frequency.value = 16;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.06;
    lfo.connect(lfoGain); lfoGain.connect(out.gain); lfo.start(t0);

    // 排気のエア感（ループノイズ）
    const nbuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 1.0), ctx.sampleRate);
    const nd = nbuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * 0.5;
    const nSrc = ctx.createBufferSource(); nSrc.buffer = nbuf; nSrc.loop = true;
    const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 1400; nf.Q.value = 0.7;
    const ng = ctx.createGain(); ng.gain.value = 0.05;
    nSrc.connect(nf); nf.connect(ng); ng.connect(out); nSrc.start(t0);

    let stopped = false;
    return {
      setPitch(m) {
        if (stopped || !ctx) return;
        const tt = ctx.currentTime;
        oscs.forEach((o, i) => o.frequency.setTargetAtTime(base[i] * m, tt, 0.08));
        lfo.frequency.setTargetAtTime(16 * m, tt, 0.08);
      },
      stop() {
        if (stopped || !ctx) return;
        stopped = true;
        const tt = ctx.currentTime;
        out.gain.cancelScheduledValues(tt);
        out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), tt);
        out.gain.exponentialRampToValueAtTime(0.001, tt + 0.3);  // フェードアウト
        const end = tt + 0.36;
        oscs.forEach(o => o.stop(end));
        lfo.stop(end); nSrc.stop(end);
      }
    };
  }

  function startBgm(mode = 'map') {
    if (muted) return;
    stopBgm();
    init();
    if (!ctx) return;
    resumeIfSuspended();

    const track = TRACKS[mode] || TRACKS.map;
    const stepMs = (60 / track.bpm / 4) * 1000; // 16分音符長
    const stepSec = stepMs / 1000;
    const totalSteps = track.bars * 16;

    let step = 0;
    let stopped = false;
    bgmController = { stop: () => { stopped = true; } };

    function scheduleStep() {
      if (stopped || muted) return;
      const s = step % totalSteps;

      // 各ノートをスケジュール
      track.lead.filter(n => n[0] === s).forEach(n => beep(n[1], n[2], n[3], n[4]));
      track.bass.filter(n => n[0] === s).forEach(n => beep(n[1], n[2], n[3], n[4]));
      track.drums.filter(n => n[0] === s).forEach(n => {
        if (n[1] === 'k') kick();
        else if (n[1] === 's') snare();
        else if (n[1] === 'h') hat();
      });

      step++;
      setTimeout(scheduleStep, stepMs);
    }
    scheduleStep();
  }

  function stopBgm() {
    if (bgmController) { bgmController.stop(); bgmController = null; }
  }

  function toggleMute() {
    muted = !muted;
    if (muted) stopBgm();
    return muted;
  }

  function isMuted() { return muted; }

  return { SFX, startBgm, stopBgm, startEngine, toggleMute, isMuted, init, resumeIfSuspended };
})();
