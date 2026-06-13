// ベルトスクロールアクション戦闘エンジン（ダブルドラゴン方式）
// - 駅前ステージを右へ進む → 雑魚ウェーブ → ボス戦
// - DOM + requestAnimationFrame。entity(位置transform) / fighter(モーションCSS) の2層構造
// - 旧 battle.js の互換API（init/stop/playerAction）を維持し game.js は無改造で動く
window.Battle = (function() {
  let S = null; // セッション状態（戦闘ごとに作り直す）

  // ==== 定数 ====
  const SPR_W = 90, SPR_H = 166;   // スプライトの論理ボックス
  const PLAYER_SPEED = 235;        // px/s
  const STAGE_SCREENS = 3;         // ステージ幅 = 画面幅 × これ
  const HURT_T = 0.32, DOWN_T = 0.95, GETUP_T = 0.5;

  // プレイヤーの技
  const P_MOVES = {
    punch:   { name: 'パンチ', anim: 'punch',  mult: 1.0, reach: 64,  cd: 0.3,  hitAt: 0.1,  down: false, sfx: 'punch' },
    kick:    { name: 'キック', anim: 'kick',   mult: 1.6, reach: 88,  cd: 0.55, hitAt: 0.2,  down: true,  sfx: 'kick' },
    special: { name: '必殺技', anim: 'special', mult: 2.5, reach: 165, cd: 1.0,  hitAt: 0.3,  down: true,  sfx: 'special', radial: true, useMeter: true }
  };

  // 雑魚9アーキタイプ（HP/ATKはその駅のボス値に連動して自然にスケール・髪型/服/小物バラバラ）
  const MOB_TYPES = [
    { key: 'chinpira',  name: 'チンピラ',  archetypeId: 'mob-cig',  hpF: 0.50, atkF: 0.45, speed: 95,  reach: 60, cdMin: 1.0, cdMax: 1.9 },
    { key: 'charai',    name: 'チャラ男',  archetypeId: 'mob-afro', hpF: 0.45, atkF: 0.50, speed: 120, reach: 58, cdMin: 0.9, cdMax: 1.7 },
    { key: 'mohican',   name: '尖り',      archetypeId: 'mob-moha', hpF: 0.55, atkF: 0.60, speed: 100, reach: 62, cdMin: 1.0, cdMax: 1.8 },
    { key: 'pipe',      name: '鉄パイプ',  archetypeId: 'mob-pipe', hpF: 0.60, atkF: 0.65, speed: 80,  reach: 78, cdMin: 1.2, cdMax: 2.0 },
    { key: 'gatai',     name: 'ガタイ',    archetypeId: 'mob-big',  hpF: 0.95, atkF: 0.70, speed: 60,  reach: 66, cdMin: 1.4, cdMax: 2.3 },
    { key: 'kosodoro',  name: 'コソ泥',    archetypeId: 'mob-mask', hpF: 0.40, atkF: 0.45, speed: 140, reach: 56, cdMin: 0.8, cdMax: 1.6 },
    { key: 'kakukari',  name: '突っ張り',  archetypeId: 'mob-flat', hpF: 0.65, atkF: 0.55, speed: 85,  reach: 64, cdMin: 1.1, cdMax: 2.0 },
    { key: 'longhair',  name: '与太者',    archetypeId: 'mob-long', hpF: 0.50, atkF: 0.55, speed: 105, reach: 60, cdMin: 1.0, cdMax: 1.8 },
    { key: 'yotaku',    name: '半グレ',    archetypeId: 'mob-allb', hpF: 0.70, atkF: 0.65, speed: 90,  reach: 64, cdMin: 1.1, cdMax: 2.0 }
  ];

  // ボスの技パターン（旧1vs1のアーキタイプ別パターンをベルト用にマッピング）
  // anim: punch/kick/special/throw=その場打撃, dash=突進, guard=後退して様子見
  const BOSS_PATTERNS = {
    'yankee-basic': [
      { name: 'パンチ', mult: 1.0, weight: 5, anim: 'punch', reach: 66 },
      { name: 'キック', mult: 1.4, weight: 3, anim: 'kick', reach: 88 }
    ],
    'yankee-fisher': [
      { name: '釣り竿スイング', mult: 1.2, weight: 4, anim: 'punch', reach: 80 },
      { name: '網投げ', mult: 1.5, weight: 3, anim: 'throw', reach: 95 },
      { name: '様子見', weight: 2, anim: 'guard' }
    ],
    'yankee-fire': [
      { name: '火炎パンチ', mult: 1.3, weight: 4, anim: 'punch', reach: 70 },
      { name: '火の粉キック', mult: 1.7, weight: 3, anim: 'kick', reach: 90 },
      { name: '燃え盛る突進', mult: 2.0, weight: 2, anim: 'dash' }
    ],
    'kid-boss': [
      { name: '頭突き', mult: 0.9, weight: 5, anim: 'punch', reach: 56 },
      { name: '体当たり', mult: 1.3, weight: 3, anim: 'dash' },
      { name: 'ベロベロバー', mult: 0.5, weight: 2, anim: 'punch', reach: 56 }
    ],
    'samurai-yanki': [
      { name: '木刀斬り', mult: 1.5, weight: 4, anim: 'kick', reach: 100 },
      { name: '居合斬り', mult: 2.5, weight: 2, anim: 'special', reach: 115 },
      { name: '構え', weight: 2, anim: 'guard' }
    ],
    'matcha-boss': [
      { name: '茶碗投げ', mult: 1.4, weight: 4, anim: 'throw', reach: 95 },
      { name: '熱い抹茶', mult: 1.8, weight: 3, anim: 'special', reach: 100 },
      { name: '茶筅乱舞', mult: 1.2, weight: 3, anim: 'punch', reach: 70 },
      { name: '様子見', weight: 1, anim: 'guard' }
    ],
    'girl-yankee': [
      { name: 'ビンタ', mult: 0.9, weight: 4, anim: 'punch', reach: 64 },
      { name: 'ハイヒールキック', mult: 1.8, weight: 3, anim: 'kick', reach: 92 },
      { name: '髪の毛つかみ', mult: 1.3, weight: 2, anim: 'throw', reach: 66 }
    ],
    'big-boss': [
      { name: '怪力パンチ', mult: 1.5, weight: 4, anim: 'punch', reach: 76 },
      { name: '振り回し', mult: 2.2, weight: 3, anim: 'throw', reach: 90 },
      { name: '地響きストンプ', mult: 1.8, weight: 2, anim: 'kick', reach: 100 }
    ],
    'final-boss': [
      { name: '王者の拳', mult: 1.4, weight: 4, anim: 'punch', reach: 72 },
      { name: '名鉄旋風脚', mult: 2.0, weight: 3, anim: 'kick', reach: 100 },
      { name: '総長の一撃', mult: 3.0, weight: 2, anim: 'special', reach: 110 },
      { name: '突進', mult: 1.8, weight: 2, anim: 'dash' }
    ],
    'yakuza': [
      { name: '懐から出す', mult: 1.5, weight: 3, anim: 'special', reach: 120 },
      { name: '組長の威圧', mult: 2.0, weight: 3, anim: 'dash' },
      { name: '指詰めキック', mult: 2.5, weight: 2, anim: 'kick', reach: 95 }
    ],
    'gambler-boss': [
      { name: 'イカサマパンチ', mult: 1.1, weight: 4, anim: 'punch', reach: 66 },
      { name: 'コイン投げ', mult: 1.4, weight: 3, anim: 'throw', reach: 100 },
      { name: 'ハッタリ突進', mult: 1.8, weight: 2, anim: 'dash' },
      { name: 'ポーカーフェイス', weight: 1, anim: 'guard' }
    ],
    'thrower-boss': [
      { name: '連投', mult: 0.8, weight: 5, anim: 'throw', reach: 100 },
      { name: '剛速球', mult: 1.8, weight: 3, anim: 'throw', reach: 110 },
      { name: '皮で滑らす', mult: 1.2, weight: 2, anim: 'kick', reach: 88 }
    ],
    'onsen-boss': [
      { name: '湯気目つぶし', mult: 1.0, weight: 4, anim: 'special', reach: 95 },
      { name: '湯桶投げ', mult: 1.5, weight: 3, anim: 'throw', reach: 100 },
      { name: 'のぼせ拳', mult: 2.0, weight: 2, anim: 'punch', reach: 72 },
      { name: '湯けむり防御', weight: 1, anim: 'guard' }
    ],
    'riezent-boss': [
      { name: 'リーゼントヘッド', mult: 1.3, weight: 4, anim: 'punch', reach: 76 },
      { name: '櫛投げ', mult: 1.2, weight: 3, anim: 'throw', reach: 105 },
      { name: '逆毛逆襲', mult: 2.2, weight: 2, anim: 'dash' }
    ],
    'karate-boss': [
      { name: '正拳突き', mult: 1.4, weight: 4, anim: 'punch', reach: 72 },
      { name: '上段蹴り', mult: 1.8, weight: 3, anim: 'kick', reach: 98 },
      { name: '型', weight: 1, anim: 'guard' },
      { name: '瓦割り掌', mult: 2.5, weight: 2, anim: 'special', reach: 100 }
    ],
    'skinhead': [
      { name: '青龍刀斬り', mult: 1.6, weight: 4, anim: 'slash', reach: 105 },
      { name: '兜割り', mult: 2.4, weight: 2, anim: 'slash', reach: 112 },
      { name: '突進斬り', mult: 2.0, weight: 2, anim: 'dash' },
      { name: '刀を構える', weight: 1, anim: 'guard' }
    ]
  };

  // ==== fame帯別の台詞（序盤ナメ→中盤警戒→終盤怯え） ====
  // {playerName}=噂の主人公として認識される／{station}=駅名
  const MOB_LINES = {
    low: [
      'おい、金貸してくれよ。返さねーけどさ',
      '新入りか？シメといてやるよ',
      'ちょうどいい、パシリが欲しかったんだ',
      '弱そうなのが来たな',
      '通りてぇなら金置いてけ'
    ],
    mid: [
      'お前…最近暴れてる奴か？',
      'ナメてかかると痛い目見るぜ…？',
      'やんのか？こっちも引けねぇ',
      '{station}で勝手はさせねぇ'
    ],
    high: [
      'あいつ、噂の三谷水産の{playerName}だ！',
      '{playerName}…ここで会っちまったか…！',
      'ヒィッ、逃げろ！',
      'マジかよ、本物じゃねえか…'
    ]
  };
  const HURT_LINES = {
    low: ['痛えな、何しやがる！', 'このガキ…！', '調子に乗んなよ'],
    mid: ['っ…やるじゃねえか', 'くそっ、効いた…', 'まだだ…！'],
    high: ['か、勝てねえ…！', 'ば、化け物かよ…', '助けてくれ…！']
  };
  function playerName() {
    return (S && S.playerName)
      || (window.Game && window.Game.getPlayer && window.Game.getPlayer().name)
      || 'ボンタン狩り太郎';
  }
  function fameBand() {
    const f = (S && S.fame) || 0;
    if (f < 40) return 'low';
    if (f < 140) return 'mid';
    return 'high';
  }
  function fillLine(s) {
    const st = (S && S.station && S.station.name) || 'ここ';
    return s.replace(/\{playerName\}/g, playerName()).replace(/\{station\}/g, st);
  }
  function pickLine(table) {
    const arr = table[fameBand()] || table.low;
    return fillLine(arr[Math.floor(Math.random() * arr.length)]);
  }
  // 雑魚の恫喝（fame帯で出し分け）
  function mobTaunt() {
    return pickLine(MOB_LINES);
  }

  const TAUNTS = [
    'どうした、もう終わりか?',
    'その程度か',
    'ボンタンは渡さない',
    '歯を食いしばれ',
    '上等だ',
    '本気でやる',
    '容赦しない'
  ];

  // ==== DOMヘルパ ====
  const $ = id => document.getElementById(id);

  // #rrggbb の色相を deg 度回転（雑魚の個体差用）
  function shiftColor(hex, deg) {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (mx + mn) / 2, d = mx - mn;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    h = (h + deg + 360) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    const seg = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    const to = v => Math.round((v + m) * 255).toString(16).padStart(2, '0');
    return '#' + to(seg[0]) + to(seg[1]) + to(seg[2]);
  }

  function makeEntity(kind, archetypeId, data, x, y) {
    const el = document.createElement('div');
    el.className = 'entity';
    el.innerHTML = `
      <div class="fighter belt-f">
        <div class="char-aura"></div>
        <div class="char-accessory"></div>
        <div class="char-head"></div>
        <div class="char-body"></div>
        <div class="char-pants"></div>
        <div class="char-shadow"></div>
        <div class="dq-fist"></div>
        <div class="dq-foot"></div>
        ${kind === 'mob' ? '<div class="mini-hp"><i></i></div>' : ''}
      </div>`;
    const fEl = el.querySelector('.fighter');
    const sc = window.Sprites.applyCharSprite(fEl, archetypeId, data);
    $('belt-world').appendChild(el);
    return {
      kind, el, fEl,
      x, y, dir: kind === 'player' ? 1 : -1,
      scale: sc,
      hp: data.hp, maxHp: data.hp, atk: data.atk || 5,
      speed: data.speed || 80,
      state: 'idle', stateT: 0, cdLeft: 0.6, invulnT: 0, hurtCount: 0,
      move: null, hitDone: false,
      data,
      lastTrans: ''
    };
  }

  function removeEntity(e) {
    if (e.engineSfx) { e.engineSfx.stop(); e.engineSfx = null; }   // 単車エンジン音を止める
    if (e.el && e.el.parentNode) e.el.parentNode.removeChild(e.el);
  }

  function setAnim(e, anim, dur) {
    e.fEl.classList.remove('act-punch', 'act-kick', 'act-special', 'act-dash', 'act-throw', 'act-slash');
    if (anim) {
      void e.fEl.offsetWidth;
      e.fEl.classList.add('act-' + anim);
      if (dur) setTimeout(() => e.fEl && e.fEl.classList.remove('act-' + anim), dur * 1000);
    }
  }

  // ==== 演出（旧battle.jsから移植） ====
  function log(msg) {
    if (!S) return;
    S.log.push(msg);
    const el = $('battle-log');
    el.innerHTML = S.log.slice(-2).map(m => `<div>${m}</div>`).join('');
    el.scrollTop = el.scrollHeight;
  }

  function screenPos(e) {
    return { x: e.x - S.cam, y: S.groundTop + e.y };
  }

  function showDamageNumber(e, dmg, type) {
    const dn = $('damage-numbers');
    const p = screenPos(e);
    const el = document.createElement('div');
    el.className = 'damage-num';
    if (type === 'critical') el.classList.add('critical');
    if (type === 'miss') el.classList.add('miss');
    el.textContent = type === 'miss' ? 'MISS' : (type === 'critical' ? `${dmg}!` : `${dmg}`);
    el.style.left = (p.x - 16 + Math.random() * 30 - 15) + 'px';
    el.style.top = (p.y - SPR_H * 0.85) + 'px';
    dn.appendChild(el);
    setTimeout(() => el.remove(), 850);
  }

  function showHitText(e, text) {
    const fx = $('hit-effect');
    const p = screenPos(e);
    fx.textContent = text;
    fx.style.left = (p.x - 30) + 'px';
    fx.style.top = (p.y - SPR_H - 10) + 'px';
    fx.classList.remove('show');
    void fx.offsetWidth;
    fx.classList.add('show');
  }

  // 斬撃の軌跡（青龍刀を振った時の白い弧）
  function showSlash(att) {
    const stage = $('battle-stage');
    const p = screenPos(att);
    const s = document.createElement('div');
    s.className = 'slash-arc';
    s.style.left = (p.x + att.dir * 30 - 38) + 'px';
    s.style.top = (p.y - SPR_H * 0.82) + 'px';
    stage.appendChild(s);
    setTimeout(() => s.remove(), 320);
  }

  // ヒット火花（命中地点に星形スパーク）
  function showSpark(e, big) {
    const stage = $('battle-stage');
    const p = screenPos(e);
    const max = !!(S && S.meter >= 100);   // アドレナリンMAX中は火花2倍
    const count = max ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'hit-spark' + (big ? ' big' : '') + (max ? ' max' : '');
      s.style.left = (p.x - 17 + Math.random() * 16 - 8) + 'px';
      s.style.top = (p.y - SPR_H * 0.55 + Math.random() * 16 - 8) + 'px';
      stage.appendChild(s);
      setTimeout(() => s.remove(), 300);
    }
  }

  // 血しぶきの量設定（off / stylish / heavy、デフォ stylish）。外部UIからも切替可能。
  function getBloodLevel() {
    try { return localStorage.getItem('mbg_bloodLevel') || 'stylish'; } catch (e) { return 'stylish'; }
  }
  window.BloodFX = {
    get: getBloodLevel,
    set(v) { try { localStorage.setItem('mbg_bloodLevel', v); } catch (e) {} }
  };

  // スタイリッシュ血しぶき（CSSのみ・PNG不要。トーン＝漫画的な赤バースト）。
  // big=強打ほど大量、mult=crit等の倍率、アドレナリンMAX中はさらに2倍。
  function showBlood(e, big, mult) {
    const lv = getBloodLevel();
    if (lv === 'off') return;
    const stage = $('battle-stage');
    const p = screenPos(e);
    const maxAdr = !!(S && S.meter >= 100);
    let n = (big ? 5 : 3) + Math.floor(Math.random() * 2);            // 基本3〜6個
    n = Math.round(n * (mult || 1) * (lv === 'heavy' ? 1.6 : 1) * (maxAdr ? 2 : 1));
    for (let i = 0; i < n; i++) {
      const d = document.createElement('div');
      d.className = 'blood-drop' + (big ? ' big' : '');
      const ang = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * (big ? 60 : 40);
      d.style.left = (p.x - 4) + 'px';
      d.style.top = (p.y - SPR_H * 0.55) + 'px';
      d.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
      d.style.setProperty('--dy', (Math.sin(ang) * dist - 10) + 'px');
      d.style.setProperty('--sz', (3 + Math.random() * (big ? 6 : 4)) + 'px');
      stage.appendChild(d);
      setTimeout(() => d.remove(), 420);
    }
    // 小さな汗滴（1〜2個）
    const sweat = Math.random() < 0.6 ? 1 : 2;
    for (let i = 0; i < sweat; i++) {
      const s = document.createElement('div');
      s.className = 'sweat-drop';
      s.style.left = (p.x + (Math.random() * 20 - 10)) + 'px';
      s.style.top = (p.y - SPR_H * 0.8) + 'px';
      stage.appendChild(s);
      setTimeout(() => s.remove(), 500);
    }
  }

  function flashScreen() {
    const flash = $('screen-flash');
    flash.classList.remove('show');
    void flash.offsetWidth;
    flash.classList.add('show');
  }

  function shakeStage() {
    const stage = $('battle-stage');
    stage.classList.remove('shake');
    void stage.offsetWidth;
    stage.classList.add('shake');
  }

  function showCombo(n) {
    const el = $('combo-display');
    if (n < 2) { el.classList.remove('show', 'chain'); return; }
    el.classList.remove('chain');
    el.textContent = `${n} HIT COMBO!`;
    // コンボが伸びるほど大きく・熱い色に（手応えの段階表現）
    el.style.fontSize = Math.min(46, 22 + n * 1.4) + 'px';
    el.style.color = n >= 30 ? '#ff3366' : n >= 15 ? '#ff9a00' : n >= 8 ? '#ffe600' : '#fff';
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }

  function showTaunt(e, text) {
    if (!text) return;
    const stage = $('battle-stage');
    const old = stage.querySelector('.speech-bubble');
    if (old) old.remove();
    const b = document.createElement('div');
    b.className = 'speech-bubble';
    b.textContent = text;
    const p = screenPos(e);
    b.style.left = Math.max(4, Math.min(S.viewW - 160, p.x - 80)) + 'px';
    b.style.top = Math.max(4, p.y - SPR_H - 48) + 'px';
    stage.appendChild(b);
    setTimeout(() => b.remove(), 1800);
  }

  // ==== 必殺ゲージ ====
  function gainMeter(n) {
    if (!S) return;
    const was = S.meter;
    S.meter = Math.min(100, S.meter + n);
    updateMeterUI();
    if (was < 100 && S.meter >= 100) {
      log('<span style="color:#ffcc00; font-weight:bold">🔥 アドレナリンMAX！！</span>');
      window.Audio8 && window.Audio8.SFX.levelup && window.Audio8.SFX.levelup();
      adrenalineMaxCallout();
    }
  }

  function updateMeterUI() {
    const pct = S ? Math.floor(S.meter) : 0;
    const fill = $('meter-fill');
    const txt = $('meter-text');
    if (fill) fill.style.width = pct + '%';
    if (txt) txt.textContent = pct + '%';
    const btn = document.querySelector('.belt-btn.bb-special');
    if (btn) btn.classList.toggle('ready', pct >= 100);
    // アドレナリン: メーター量(0→1)を #app のCSS変数に → 画面端の赤ヴィネットが濃くなる。
    const app = document.getElementById('app');
    if (app) {
      app.style.setProperty('--adrenaline', (pct / 100).toFixed(3));
      app.classList.toggle('adrenaline-max', pct >= 100);
    }
  }

  // アドレナリンMAX到達の演出：フラッシュ＋「ADRENALINE MAX!」コールアウト＋短いスロー（hitstop流用）
  function adrenalineMaxCallout() {
    flashScreen();
    if (S) S.hitstop = Math.max(S.hitstop, 0.15);
    const co = $('adrenaline-callout');
    if (co) {
      co.classList.remove('show');
      void co.offsetWidth;
      co.classList.add('show');
      setTimeout(() => co.classList.remove('show'), 1200);
    }
  }

  function updateHpUI() {
    const p = S.player;
    $('player-hp-fill').style.width = Math.max(0, (p.hp / p.maxHp) * 100) + '%';
    $('player-hp-text').textContent = `${Math.max(0, Math.ceil(p.hp))}/${p.maxHp}`;
    if (S.boss) {
      $('enemy-hp-fill').style.width = Math.max(0, (S.boss.hp / S.boss.maxHp) * 100) + '%';
      $('enemy-hp-text').textContent = `${Math.max(0, Math.ceil(S.boss.hp))}/${S.boss.maxHp}`;
    }
  }

  // ==== 背景 ====
  function buildBackground(stationId) {
    const scene = (window.SCENES && window.SCENES[stationId]) || null;
    const bg = $('belt-bg');
    bg.innerHTML = '';
    bg.style.width = S.stageW + 'px';
    const photoCredit = $('photo-credit');
    photoCredit.textContent = '';
    photoCredit.style.display = 'none';

    const gh = scene ? (scene.groundH || 35) : 35;
    // 空・遠景レイヤー
    const sky = document.createElement('div');
    sky.className = 'belt-sky';
    sky.style.background = scene ? scene.sky : 'linear-gradient(180deg, #4a6fa5 0%, #7a9fcf 100%)';
    bg.appendChild(sky);

    // 駅写真（あれば空レイヤーの上に表示）
    const credit = window.PHOTO_CREDITS && window.PHOTO_CREDITS[stationId];
    const bgImage = (scene && scene.bgImage) || (credit && `assets/bg/${stationId}.jpg`);
    if (bgImage) {
      const img = new Image();
      img.onload = () => {
        if (!S || S.stationId !== stationId) return;
        const photo = document.createElement('div');
        photo.className = 'belt-photo';
        photo.style.backgroundImage = `url(${bgImage})`;
        sky.appendChild(photo);
        // 実写の上では絵文字デコが浮くので消す（地面と看板は残す）
        bg.querySelectorAll('.scene-deco').forEach(d => d.remove());
        if (credit) {
          photoCredit.textContent = `Photo: ${credit.author} / ${credit.license}`;
          photoCredit.style.display = '';
        }
      };
      img.src = bgImage;
    }

    // 地面
    const ground = document.createElement('div');
    ground.className = 'belt-ground';
    ground.style.height = gh + '%';
    ground.style.background = scene ? scene.ground : 'linear-gradient(180deg, #5a7a3a, #3a5a1a)';
    bg.appendChild(ground);

    // デコ絵文字（ステージ全幅に散らす）
    if (scene) {
      (scene.deco || []).forEach(d => {
        const el = document.createElement('div');
        el.className = 'scene-deco';
        el.textContent = d.e;
        el.style.cssText = `position:absolute; left:${d.x}%; top:${d.y}%; font-size:${d.s}px; transform:translate(-50%,-50%) ${d.r ? `rotate(${d.r}deg)` : ''}; z-index:${d.y > (100 - gh) ? 2 : 1};`;
        bg.appendChild(el);
      });
      const label = document.createElement('div');
      label.className = 'scene-label belt-label';
      label.textContent = scene.name;
      $('battle-stage').appendChild(label);
    }
  }

  // ==== 入力 ====
  function setupInput() {
    const ac = new AbortController();
    S.abort = ac;
    const sig = { signal: ac.signal, passive: false };
    const keys = {};

    document.addEventListener('keydown', ev => {
      if (!$('screen-battle').classList.contains('active')) return;
      const k = ev.key.toLowerCase();
      keys[k] = true;
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(k)) ev.preventDefault();
      if (k === 'a') doPlayerAttack('punch');
      if (k === 's') doPlayerAttack('kick');
      if (k === 'd') doPlayerAttack('special');
    }, sig);
    document.addEventListener('keyup', ev => { keys[ev.key.toLowerCase()] = false; }, { signal: ac.signal });

    S.readKeyboard = () => {
      let mx = 0, my = 0;
      if (keys['arrowleft'] || keys['q']) mx -= 1;
      if (keys['arrowright'] || keys['e']) mx += 1;
      if (keys['arrowup'] || keys['w']) my -= 1;
      if (keys['arrowdown'] || keys['x']) my += 1;
      return { mx, my };
    };

    // 仮想パッド（フローティングスティック、pointerIdで追跡）
    const vpad = $('vpad');
    const stick = $('vpad-stick');
    let padId = null, ox = 0, oy = 0;
    S.pad = { mx: 0, my: 0 };
    vpad.addEventListener('pointerdown', ev => {
      ev.preventDefault();
      if (padId !== null) return;
      padId = ev.pointerId;
      vpad.setPointerCapture(padId);
      ox = ev.clientX; oy = ev.clientY;
    }, sig);
    vpad.addEventListener('pointermove', ev => {
      if (ev.pointerId !== padId) return;
      ev.preventDefault();
      const R = 42;
      let dx = (ev.clientX - ox) / R, dy = (ev.clientY - oy) / R;
      const len = Math.hypot(dx, dy);
      if (len > 1) { dx /= len; dy /= len; }
      S.pad.mx = Math.abs(dx) < 0.22 ? 0 : dx;
      S.pad.my = Math.abs(dy) < 0.22 ? 0 : dy;
      stick.style.transform = `translate(${dx * 26}px, ${dy * 26}px)`;
    }, sig);
    const padEnd = ev => {
      if (ev.pointerId !== padId) return;
      padId = null;
      S.pad.mx = 0; S.pad.my = 0;
      stick.style.transform = '';
    };
    vpad.addEventListener('pointerup', padEnd, { signal: ac.signal });
    vpad.addEventListener('pointercancel', padEnd, { signal: ac.signal });

    // 攻撃ボタン
    document.querySelectorAll('.belt-btn').forEach(btn => {
      btn.addEventListener('pointerdown', ev => {
        ev.preventDefault();
        window.Audio8 && window.Audio8.resumeIfSuspended && window.Audio8.resumeIfSuspended();
        doPlayerAttack(btn.dataset.act);
      }, sig);
    });
  }

  // ==== 戦闘ロジック ====
  function canHit(att, def, reach, yTol) {
    if (def.state === 'dead' || def.state === 'down' || def.state === 'getup') return false;
    const dx = def.x - att.x;
    const inFront = Math.sign(dx) === att.dir || Math.abs(dx) < 24;
    return inFront && Math.abs(dx) < reach && Math.abs(att.y - def.y) < (yTol || 26);
  }

  function doPlayerAttack(key) {
    if (!S || S.finished) return;
    const p = S.player;
    if (p.state !== 'idle' && p.state !== 'walk') return;
    if (p.cdLeft > 0) return;
    const mv = P_MOVES[key];
    if (!mv) return;
    if (mv.useMeter && S.meter < 100) {
      log('気合いが足りねぇ…（必殺ゲージMAXで発動）');
      window.Audio8 && window.Audio8.SFX.miss();
      return;
    }
    if (mv.useMeter) { S.meter = 0; updateMeterUI(); }
    // 攻撃アシスト：正面に敵がいないが背後の射程内にいる場合は向き直る
    if (!mv.radial) {
      const front = S.enemies.some(e => canHit(p, e, mv.reach));
      if (!front) {
        const back = S.enemies.some(e => e.state !== 'dead' && e.state !== 'down' &&
          Math.sign(e.x - p.x) === -p.dir && Math.abs(e.x - p.x) < mv.reach && Math.abs(e.y - p.y) < 26);
        if (back) p.dir = -p.dir;
      }
    }
    p.state = 'attack';
    p.stateT = 0;
    p.move = mv;
    p.hitDone = false;
    p.cdLeft = mv.cd;
    setAnim(p, mv.anim, Math.max(mv.cd, 0.45));
    window.Audio8 && window.Audio8.SFX[mv.sfx] && window.Audio8.SFX[mv.sfx]();
  }

  function playerHitCheck() {
    const p = S.player;
    const mv = p.move;
    const targets = S.enemies.filter(e => mv.radial
      ? (Math.abs(e.x - p.x) < mv.reach && Math.abs(e.y - p.y) < 46 && e.state !== 'dead')
      : canHit(p, e, mv.reach));
    if (!targets.length) {
      S.stats.misses++;
      window.Audio8 && window.Audio8.SFX.miss();
      S.combo = 0;
      showCombo(0);
      return;
    }
    S.stats.hits++;
    const victims = mv.radial ? targets : [targets.sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0]];
    // コンボ（1.4秒以内の連続ヒット）
    const now = performance.now();
    if (now - S.lastHitAt < 1400) S.combo++;
    else S.combo = 1;
    if (S.combo > S.maxCombo) S.maxCombo = S.combo;   // スコア用: 最大コンボ
    S.lastHitAt = now;
    showCombo(S.combo);
    window.Audio8 && window.Audio8.SFX.combo(S.combo);

    // 3コンボ目のパンチは強パンチ（SMASH＝吹っ飛ばし）
    const smash = !mv.radial && mv.anim === 'punch' && S.combo >= 3 && S.combo % 3 === 0;

    victims.forEach(e => {
      // たむろ中の雑魚への先制攻撃でも集団が起動する
      if (e.state === 'loiter') activateWave(e.wave);
      // ライダーは殴られたら単車から吹っ飛ぶ
      if (e.kind === 'rider') dismountRider(e);
      const isCrit = Math.random() < (0.12 + (S.upg.crit || 0) * 0.05);          // 強化「一撃必殺」
      const comboLv = S.upg.combo || 0;                                          // 強化「連撃の極み」
      const comboMul = 1 + Math.min(0.4 + comboLv * 0.15, S.combo * (0.06 + comboLv * 0.015));
      const powMul = mv.useMeter ? (1 + (S.upg.power || 0) * 0.15) : 1;           // 強化「特攻魂」(必殺威力)
      let dmg = Math.max(1, Math.floor(p.atk * mv.mult * powMul * (isCrit ? 1.8 : 1) * (smash ? 1.4 : 1) * comboMul + Math.random() * 3 - 1));
      e.hp -= dmg;
      // C連動: 命中（=血が舞う）でアドレナリン微増。crit/smashほど多め。
      gainMeter(mv.useMeter ? 0 : ((mv.mult >= 1.5 ? 9 : 6) + (isCrit ? 4 : 0) + (smash ? 3 : 0)));
      showDamageNumber(e, dmg, isCrit ? 'critical' : 'normal');
      showSpark(e, isCrit || smash || mv.radial);
      showBlood(e, isCrit || smash || mv.radial, isCrit ? 1.5 : 1);
      if (isCrit || mv.radial || smash) { flashScreen(); shakeStage(); }
      // ヒットストップ: 強打ほど長く止める（通常打は軽く）
      S.hitstop = Math.max(S.hitstop, (isCrit || smash || mv.radial) ? 0.085 : 0.03);
      setTimeout(() => window.Audio8 && window.Audio8.SFX[(isCrit || smash) ? 'critical' : 'hit'](), 60);

      const dead = e.hp <= 0;
      // ボスは毎回ダウンすると getup中の点滅(invuln)で「戦闘中に透明」に見えてしまう。
      // 死亡時以外はダウンしにくくして、ボスらしく踏ん張らせる。
      const knockdown = dead || e.kind === 'rider' ||
        ((mv.down || isCrit || smash) && (e.kind !== 'boss' || Math.random() < 0.18));
      if (e.attackToken) { releaseToken(e); }
      e.move = null;
      if (knockdown) {
        e.state = 'down'; e.stateT = 0;
        e.vx = p.dir * 240; // 吹っ飛び
        e.fEl.classList.remove('hit');
        e.fEl.classList.add('down-pose');
        setAnim(e, null);
      } else {
        e.x += p.dir * 16; // ヒットのめり込み押し込み
        e.state = 'hurt'; e.stateT = 0;
        e.fEl.classList.remove('hit');
        void e.fEl.offsetWidth;
        e.fEl.classList.add('hit');
      }
      if (dead) {
        e.state = 'down';
        e.dying = true;
      }
      updateMiniHp(e);
      if (e === S.boss) {
        checkEnrage();
        updateHpUI();
      }
    });
    showHitText(victims[0], mv.radial ? 'WHAM!!' : (smash ? 'SMASH!!' : (S.combo >= 3 ? 'BOOM!' : 'BAM!')));
    // D: 高コンボ／アドレナリンMAX中は、周囲の雑魚が気圧されて日和る
    if (S.combo >= 5 || S.meter >= 100) tryCower(S.player.x);
  }

  function updateMiniHp(e) {
    const bar = e.fEl.querySelector('.mini-hp i');
    if (bar) bar.style.width = Math.max(0, (e.hp / e.maxHp) * 100) + '%';
  }

  function hurtPlayer(att, mult, moveName) {
    const p = S.player;
    if (p.invulnT > 0 || p.state === 'down' || p.state === 'getup' || S.finished) return;
    const dmg = Math.max(1, Math.floor(att.atk * (att.enraged ? 1.25 : 1) * mult * (0.9 + Math.random() * 0.3)));
    p.hp -= dmg;
    gainMeter(10);
    S.noHit = false;          // スコア用: 被弾したらノーダメ評価を外す
    S.hitstop = Math.max(S.hitstop, mult >= 1.8 ? 0.07 : 0.03);   // 被弾にも手応え
    S.combo = 0;
    showCombo(0);
    showDamageNumber(p, dmg, mult >= 2 ? 'critical' : 'normal');
    setTimeout(() => window.Audio8 && window.Audio8.SFX.hit(), 60);
    log(`${att.data.name}の${moveName}！ ${dmg}ダメージ！`);
    if (Math.random() < 0.18) showTaunt(att, pickLine(HURT_LINES));   // fame帯で被弾台詞を出し分け
    p.invulnT = 0.55;
    p.hurtCount++;
    const knockdown = mult >= 1.8 || p.hurtCount >= 3 || p.hp <= 0;
    p.move = null;
    if (knockdown) {
      p.hurtCount = 0;
      p.state = 'down'; p.stateT = 0;
      p.vx = att.dir * 260;
      p.fEl.classList.add('down-pose');
      setAnim(p, null);
      if (mult >= 2) { flashScreen(); shakeStage(); }
    } else {
      p.state = 'hurt'; p.stateT = 0;
      p.fEl.classList.remove('hit');
      void p.fEl.offsetWidth;
      p.fEl.classList.add('hit');
    }
    updateHpUI();
    if (p.hp <= 0) defeat();
  }

  // 攻撃トークン（同時に攻撃してよい敵は最大2体＝理不尽防止）
  function takeToken(e) {
    if (S.tokens <= 0) return false;
    S.tokens--; e.attackToken = true; return true;
  }
  function releaseToken(e) {
    if (e.attackToken) { e.attackToken = false; S.tokens++; }
  }

  // ==== 名声(fame) ====
  const FAME = { mob: 2, boss: 30 };           // 加算: 雑魚撃破=小／駅制圧=大
  const FAME_COWER_MIN = 40;                   // これ未満は雑魚が日和らない（蒲郡序盤＝ナメられる）
  const FAME_TITLES = [
    { min: 0,   name: '無名' },
    { min: 25,  name: '三河の暴れん坊' },
    { min: 70,  name: '蒲郡線の番長' },
    { min: 140, name: '西尾の支配者' },
    { min: 240, name: '名鉄の鬼' }
  ];
  function fameTitle(f) {
    let t = FAME_TITLES[0].name;
    for (const x of FAME_TITLES) { if ((f || 0) >= x.min) t = x.name; }
    return t;
  }
  function gainFame(n) {
    if (!S || !n) return;
    S.fame = (S.fame || 0) + n;
    const gp = window.Game && window.Game.getPlayer && window.Game.getPlayer();
    if (gp) gp.fame = (gp.fame || 0) + n;       // 永続側にも反映（persistは勝敗確定時）
  }
  // 名声で日和り確率をスケール。閾値未満は0（序盤はナメられる＝日和らない）。
  function fameCowerChance() {
    const f = (S && S.fame) || 0;
    if (f < FAME_COWER_MIN) return 0;
    return Math.min(0.85, 0.25 + (f - FAME_COWER_MIN) / 250);
  }
  window.Fame = { title: fameTitle, TITLES: FAME_TITLES };

  // ==== D: 敵が日和る（cower。名声fameで確率スケール） ====
  // 雑魚を日和らせる。ボス・ライダーは対象外（格を保つ）。originX 周辺のみ／確率で。
  function tryCower(originX, force) {
    if (!S) return;
    const bossName = (S.station && S.station.enemy && S.station.enemy.name)
      || (S.bossData && S.bossData.name) || '組長';
    const PANIC = [
      `ヒィッ…${bossName}さん呼んでくる！俺じゃ勝てねえ！`,
      'マジかよこいつ…つええ…',
      '逃げるが勝ちだぁ！'
    ];
    const ox = (originX != null) ? originX : S.player.x;
    S.enemies.forEach(e => {
      if (e.kind !== 'mob') return;                                  // ボス・ライダーは日和らない
      if (e.state === 'down' || e.state === 'dead' || e.state === 'getup'
        || e.state === 'cower' || e.state === 'loiter') return;
      if (!force && Math.abs(ox - e.x) > 150) return;
      if (Math.random() > fameCowerChance()) return;   // 名声が低い序盤は日和らない
      enterCower(e, PANIC);
    });
  }

  function enterCower(e, panicLines) {
    releaseToken(e);                                                 // 攻撃トークンを手放す＝当分殴ってこない
    e.move = null;
    e.state = 'cower'; e.stateT = 0;
    e.cowerDir = (e.x < S.player.x) ? -1 : 1;                        // プレイヤーと反対へ後ずさり
    e.fleeing = Math.random() < 0.3;                                 // 一部は画面外へ逃走
    e.fleeDir = e.cowerDir;
    e.fEl.classList.remove('hit', 'charging');
    setAnim(e, null);
    e.fEl.classList.add('cower');
    const face = e.fEl.querySelector('.dq-face');
    if (face) face.classList.add('scared');
    if (panicLines) showTaunt(e, panicLines[Math.floor(Math.random() * panicLines.length)]);
    gainMeter(3);                                                    // 連動: 日和らせるほどアドレナリン上乗せ
  }

  function checkEnrage() {
    const b = S.boss;
    if (b && !b.enraged && b.hp > 0 && b.hp / b.maxHp < 0.35) {
      b.enraged = true;
      b.speed *= 1.3;
      b.fEl.classList.add('aura-active');
      log(`<span style="color:#ff3366; font-weight:bold">${b.data.name}の目の色が変わった！！</span>`);
      showTaunt(b, '……ここからは本気でいく');
      window.Audio8 && window.Audio8.SFX.guardBreak && window.Audio8.SFX.guardBreak();
    }
  }

  // ==== ウェーブ管理 ====
  function buildWaves(station) {
    const heavy = station.isMidBoss || station.isFinalBoss;
    const waves = heavy
      ? [{ at: 0.16, mobs: 2 }, { at: 0.4, mobs: 3 }, { at: 0.6, mobs: 3 }, { at: 0.8, boss: true }]
      : [{ at: 0.22, mobs: 2 }, { at: 0.5, mobs: 3 }, { at: 0.76, boss: true }];
    return waves.map(w => ({ ...w, spawned: false }));
  }

  // たむろ集団を配置（ヤンキー座り＋タバコ。プレイヤーが近づくと絡んでくる）
  function spawnLoiterGroup(wave, waveIdx) {
    const anchorX = wave.at * (S.stageW - S.viewW) + S.viewW * 0.6;
    for (let i = 0; i < wave.mobs; i++) {
      const type = MOB_TYPES[Math.floor(Math.random() * MOB_TYPES.length)];
      const x = anchorX + i * 56 + Math.random() * 24;
      const y = 14 + Math.random() * (S.yMax - 14);
      // 色は駅ボスの色相をずらして個体差、髪は黒/茶/金髪からランダム
      const hue = (Math.random() * 80 - 40) | 0;
      const HAIRS = ['#15110c', '#15110c', '#e8c34a', '#6b3f16', '#e8c34a'];
      const mob = makeEntity('mob', type.archetypeId, {
        name: type.name,
        hp: Math.max(6, Math.ceil(S.bossData.hp * 0.3 * type.hpF)),
        atk: Math.max(2, Math.round(S.bossData.atk * type.atkF)),
        speed: type.speed,
        color: S.bossData.color,
        bontanColor: S.bossData.bontanColor,
        gakOverride: shiftColor(S.bossData.color, hue),
        hairOverride: HAIRS[Math.floor(Math.random() * HAIRS.length)],
        spriteHue: hue // PNGスプライト時の色違い（hue-rotate）
      }, x, y);
      mob.type = type;
      mob.wave = waveIdx;
      mob.state = 'loiter';
      mob.dir = Math.random() < 0.5 ? -1 : 1; // たむろ中は適当な方向を向く
      mob.fEl.classList.add('loiter');
      const ciga = document.createElement('div');
      ciga.className = 'dq-ciga';
      mob.fEl.appendChild(ciga);
      S.enemies.push(mob);
    }
  }

  // 暴走族ライダー：単車で画面を横切りプレイヤーを轢きに来る。殴れば一撃で吹っ飛ぶ
  function spawnRider() {
    const HAIRS = ['#15110c', '#e8c34a', '#e8c34a', '#6b3f16'];
    const rider = makeEntity('mob', 'yankee-basic', {
      name: '暴走族',
      hp: Math.max(4, Math.ceil(S.bossData.hp * 0.12)),
      atk: Math.max(3, Math.round(S.bossData.atk * 0.6)),
      speed: 430,
      color: '#16161c',
      bontanColor: '#101014',
      gakOverride: '#16161c',
      hairOverride: HAIRS[Math.floor(Math.random() * HAIRS.length)],
      spritePaths: ['assets/characters/rider.png'] // 単車込みの専用スプライト（無ければCSS単車）
    }, S.cam + S.viewW + 140, 16 + Math.random() * (S.yMax - 16));
    rider.kind = 'rider';
    rider.state = 'ride';
    rider.dir = -1;
    rider.fEl.classList.add('riding');
    const bike = document.createElement('div');
    bike.className = 'dq-bike';
    bike.innerHTML = '<u class="muf"></u><b></b><u class="cowl"></u><i class="bw f"></i><i class="bw b"></i>';
    rider.fEl.appendChild(bike);
    S.enemies.push(rider);
    setTimeout(() => { if (S && rider.state === 'ride') showTaunt(rider, 'そこをどけ！'); }, 350);
    window.Audio8 && window.Audio8.SFX.dash && window.Audio8.SFX.dash();
    // 単車のエンジン音（持続）。走行中ループ → 退場/落馬で停止
    if (window.Audio8 && window.Audio8.startEngine) rider.engineSfx = window.Audio8.startEngine();
  }

  // ライダーから単車を外す（殴り落とした時）
  function dismountRider(e) {
    e.fEl.classList.remove('riding');
    const bk = e.fEl.querySelector('.dq-bike');
    if (bk) bk.remove();
    if (e.engineSfx) { e.engineSfx.stop(); e.engineSfx = null; }   // 落馬したらエンジン音停止
  }

  // たむろ集団が絡んでくる（接近 or 先制攻撃で発動）
  function activateWave(waveIdx) {
    const w = S.waves[waveIdx];
    if (!w || w.activated) return;
    w.activated = true;
    const group = S.enemies.filter(e => e.wave === waveIdx);
    group.forEach((e, i) => {
      e.fEl.classList.remove('loiter');
      const c = e.fEl.querySelector('.dq-ciga');
      if (c) c.remove();
      e.fEl.classList.add('stand-up');
      setTimeout(() => e.fEl && e.fEl.classList.remove('stand-up'), 350);
      if (e.state === 'loiter') e.state = 'idle';
      e.cdLeft = 0.9 + i * 0.3;
      e.dir = S.player.x > e.x ? 1 : -1;
    });
    if (group[0]) showTaunt(group[0], pickLine(MOB_LINES));   // fame帯で登場台詞を出し分け
    log('<span style="color:#ff9966">不良たちに絡まれた！</span>');
    window.Audio8 && window.Audio8.SFX.guardBreak && window.Audio8.SFX.guardBreak();
  }

  function spawnBoss() {
    const st = S.station;
    const d = S.bossData;
    // 駅専用ボス画像があれば最優先（assets/characters/boss/<駅id>.png）。
    // ただしボス編集でキャラを変更している場合は駅専用画像をスキップ（選んだ見た目を尊重）
    const arch = d.archetypeId || 'yankee-basic';
    const bossData = {
      ...d,
      spritePaths: d._customArch
        ? [`assets/characters/${arch}.png`]
        : [`assets/characters/boss/${S.stationId}.png`, `assets/characters/${arch}.png`]
    };
    const boss = makeEntity('boss', d.archetypeId || 'yankee-basic', bossData, S.cam + S.viewW + 80, S.yMax * 0.5);
    boss.kind = 'boss';
    boss.patterns = BOSS_PATTERNS[d.archetypeId] || BOSS_PATTERNS['yankee-basic'];
    // ボス格で大型化 (ラスボス > 中ボス > 駅ボス)
    boss.scale *= st.isFinalBoss ? 1.45 : st.isMidBoss ? 1.30 : 1.18;
    // stations.js の speed は抽象値(3〜13)なので歩行速度(px/s)へ換算
    boss.speed = 75 + (d.speed || 5) * 6;
    S.enemies.push(boss);
    S.boss = boss;
    // ボスHPバー表示
    document.querySelector('.hp-bar.enemy-hp').style.visibility = 'visible';
    document.querySelector('.vs-label').style.visibility = 'visible';
    $('enemy-name').textContent = d.name;
    updateHpUI();
    if (d.isRare) {
      log(`<span style="color:#ff3366; font-weight:bold">⚠️ レアエンカウント！本物の極道が現れた！</span>`);
    }
    log(`${d.title}「${d.name}」が現れた！`);
    setTimeout(() => { if (S && S.boss) showTaunt(S.boss, d.voice); }, 400);
    window.Audio8 && window.Audio8.SFX.final && (st.isFinalBoss || d.isRare) && window.Audio8.SFX.final();
  }

  function updateWaves() {
    const progress = S.cam / (S.stageW - S.viewW);
    // ボスのみ進行度で出現（雑魚は最初からたむろ配置）
    for (const w of S.waves) {
      if (w.boss && !w.spawned && progress >= w.at - 0.001) {
        w.spawned = true;
        spawnBoss();
      }
    }
    // 暴走族ライダーの襲来（進行度トリガー、駅ごとに2回）
    for (const r of S.riderEvents) {
      if (!r.done && progress >= r.at) {
        r.done = true;
        log('<span style="color:#ff9966">🏍 単車の爆音が近づいてくる…！</span>');
        setTimeout(() => { if (S && !S.finished) spawnRider(); }, 700);
      }
    }

    // 戦闘中（たむろ・通過中ライダー以外の敵がいる）はカメラロック
    const fighting = S.enemies.some(e => e.state !== 'loiter' && !(e.kind === 'rider' && e.state === 'ride'));
    if (fighting) {
      S.lockCam = true;
      S.wasFighting = true;
    } else {
      S.lockCam = false;
      if (S.wasFighting) {
        S.wasFighting = false;
        const more = S.enemies.length > 0 || S.waves.some(w => w.boss && !w.spawned);
        if (more) {
          $('go-arrow').classList.add('show');
          setTimeout(() => $('go-arrow').classList.remove('show'), 2200);
          window.Audio8 && window.Audio8.SFX.levelup && window.Audio8.SFX.levelup();
        }
      }
    }
  }

  // ==== 敵更新 ====
  function updateEnemy(e, dt) {
    e.stateT += dt;
    e.cdLeft -= dt;

    // 暴走族ライダー：走行中は直進、轢き判定、画面外で消える
    if (e.kind === 'rider' && e.state === 'ride') {
      e.x += e.dir * 430 * dt;
      // ドップラー: プレイヤーへ接近中は高め、通過後は低め
      if (e.engineSfx) e.engineSfx.setPitch((e.x - S.player.x) > 0 ? 1.12 : 0.9);
      if (!e.hitDone && Math.abs(S.player.x - e.x) < 50 && Math.abs(S.player.y - e.y) < 26) {
        e.hitDone = true;
        hurtPlayer(e, 1.6, '単車アタック');
      }
      if (e.x < S.cam - 180) { e.state = 'dead'; removeEntity(e); }
      return;
    }

    switch (e.state) {
      case 'loiter':
        // たむろ中：プレイヤーが近づくと一斉に立ち上がって絡む
        if (Math.abs(S.player.x - e.x) < 190) activateWave(e.wave);
        return;
      case 'hurt':
        if (e.stateT > HURT_T) { e.state = 'idle'; e.fEl.classList.remove('hit'); }
        return;
      case 'down': {
        // 吹っ飛び減速
        e.x += (e.vx || 0) * dt;
        e.vx = (e.vx || 0) * Math.pow(0.02, dt);
        if (e.stateT > DOWN_T) {
          if (e.dying) {
            e.state = 'dead';
            e.fEl.classList.remove('down-pose');
            e.fEl.classList.add('defeated');
            // ※以前は e.el.style.opacity='0' で即時に消していたが、ボスが「戦闘中に
            //   いきなり透明になった」ように見えるため廃止。.defeated の倒れ込み演出を見せる。
            if (e === S.boss) victory();
            else {
              gainMeter(8);
              gainFame(FAME.mob);   // 名声: ボンタン狩り(雑魚撃破)=小
              log(`${e.data.name}を倒した！`);
              tryCower(e.x);   // D: 目の前で仲間がKO→周囲の雑魚が日和る
            }
            // ボスは「撃破→倒れたまま」を勝利カットシーンまで見せる。
            // (以前は700msで消していたが、カットシーンは1300ms後のため、その差でボスだけ
            //  戦闘画面から消えて「戦闘中に透明になった」ように見えていた=本バグの正体)
            if (e !== S.boss) setTimeout(() => removeEntity(e), 700);
          } else {
            e.state = 'getup'; e.stateT = 0;
            e.fEl.classList.remove('down-pose');
            e.fEl.classList.add('invuln');
          }
        }
        return;
      }
      case 'getup':
        if (e.stateT > GETUP_T) { e.state = 'idle'; e.fEl.classList.remove('invuln'); }
        return;
      case 'dead':
        return;
      case 'attack': {
        const mv = e.move;
        if (!mv) { e.state = 'idle'; return; }
        if (mv.anim === 'dash') {
          // 突進：プレイヤー方向へ加速、接触で命中
          e.x += e.dir * e.speed * 3.2 * dt;
          if (!e.hitDone && canHit(e, S.player, 50, 32)) {
            e.hitDone = true;
            hurtPlayer(e, mv.mult, mv.name);
          }
          if (e.stateT > 0.55) { e.state = 'idle'; e.cdLeft = e.cdAfter || 1.2; releaseToken(e); setAnim(e, null); }
        } else {
          if (!e.hitDone && e.stateT >= 0.18) {
            e.hitDone = true;
            if (mv.anim === 'slash') showSlash(e); // 青龍刀の斬撃軌跡
            if (canHit(e, S.player, mv.reach, 30)) hurtPlayer(e, mv.mult, mv.name);
            const sfx = { punch: 'punch', kick: 'kick', special: 'special', throw: 'throw', slash: 'kick' }[mv.anim] || 'punch';
            window.Audio8 && window.Audio8.SFX[sfx] && window.Audio8.SFX[sfx]();
          }
          if (e.stateT > 0.5) { e.state = 'idle'; e.cdLeft = e.cdAfter || 1.2; releaseToken(e); }
        }
        return;
      }
      case 'telegraph':
        if (e.stateT > 0.55) {
          e.fEl.classList.remove('charging');
          e.state = 'attack'; e.stateT = 0; e.hitDone = false;
          setAnim(e, e.move.anim, 0.6);
        }
        return;
      case 'retreat': {
        e.x -= e.dir * e.speed * 0.8 * dt;
        if (e.stateT > 0.6) { e.state = 'idle'; e.cdLeft = 0.5; }
        return;
      }
      case 'cower': {
        if (e.fleeing) {
          e.x += e.fleeDir * 170 * dt;                               // 画面外へ逃走
          if (e.x < S.cam - 220 || e.x > S.cam + S.viewW + 220) { e.state = 'dead'; removeEntity(e); }
          return;
        }
        e.x += e.cowerDir * 22 * dt;                                 // じりじり後ずさり
        if (e.stateT > 2.4) {                                        // 一定時間ビビって我に返る
          e.state = 'idle'; e.cdLeft = 0.6;
          e.fEl.classList.remove('cower');
          const face = e.fEl.querySelector('.dq-face');
          if (face) face.classList.remove('scared');
        }
        return;
      }
    }

    // idle/walk: プレイヤーへ接近
    const p = S.player;
    if (S.finished || p.state === 'dead') return;
    e.dir = p.x > e.x ? 1 : -1;
    const reach = e.kind === 'boss' ? 70 : e.type.reach;
    const wantX = p.x - e.dir * (reach - 12);
    const dx = wantX - e.x, dy = p.y - e.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 6) {
      e.x += (dx / dist) * e.speed * dt;
      e.y += (dy / dist) * Math.min(e.speed, 90) * dt;
      e.y = Math.max(0, Math.min(S.yMax, e.y));
    }
    // 攻撃判断
    if (e.cdLeft <= 0 && Math.abs(p.x - e.x) < reach + 8 && Math.abs(p.y - e.y) < 26) {
      if (!takeToken(e)) { e.cdLeft = 0.4; return; }
      if (e.kind === 'boss') {
        const pat = pickPattern(e);
        if (pat.anim === 'guard') {
          releaseToken(e);
          e.state = 'retreat'; e.stateT = 0;
          return;
        }
        e.move = { ...pat, reach: pat.reach || 70 };
        e.cdAfter = 0.9 + Math.random() * 0.8;
        if (pat.mult >= 2.0) {
          e.state = 'telegraph'; e.stateT = 0;
          e.fEl.classList.add('charging');
          log(`<span style="color:#ff9966">${e.data.name}が力を溜めている…！（離れろ！）</span>`);
        } else {
          e.state = 'attack'; e.stateT = 0; e.hitDone = false;
          setAnim(e, pat.anim, 0.6);
        }
      } else {
        e.move = { name: 'パンチ', anim: Math.random() < 0.25 ? 'kick' : 'punch', mult: Math.random() < 0.25 ? 1.3 : 1.0, reach: e.type.reach };
        e.cdAfter = e.type.cdMin + Math.random() * (e.type.cdMax - e.type.cdMin);
        e.state = 'attack'; e.stateT = 0; e.hitDone = false;
        setAnim(e, e.move.anim, 0.6);
        // 攻撃しながら駅名入りで凄む
        if (Math.random() < 0.35) showTaunt(e, mobTaunt());
      }
    }
  }

  function pickPattern(boss) {
    const pats = boss.patterns;
    const total = pats.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * total;
    for (const p of pats) { if (r < p.weight) return p; r -= p.weight; }
    return pats[0];
  }

  // ==== プレイヤー更新 ====
  function updatePlayer(dt) {
    const p = S.player;
    p.stateT += dt;
    p.cdLeft -= dt;
    p.invulnT -= dt;
    if (p.invulnT <= 0) p.fEl.classList.remove('invuln');
    else if (p.state !== 'down' && p.state !== 'getup') p.fEl.classList.add('invuln');

    switch (p.state) {
      case 'attack':
        if (!p.hitDone && p.stateT >= p.move.hitAt) { p.hitDone = true; playerHitCheck(); }
        if (p.stateT >= p.move.cd) { p.state = 'idle'; }
        return;
      case 'hurt':
        if (p.stateT > HURT_T) { p.state = 'idle'; p.fEl.classList.remove('hit'); }
        return;
      case 'down':
        p.x += (p.vx || 0) * dt;
        p.vx = (p.vx || 0) * Math.pow(0.02, dt);
        if (p.stateT > DOWN_T) {
          if (p.hp <= 0) { p.state = 'dead'; return; }
          p.state = 'getup'; p.stateT = 0;
          p.fEl.classList.remove('down-pose');
          p.fEl.classList.add('invuln');
          p.invulnT = GETUP_T + 0.4;
        }
        return;
      case 'getup':
        if (p.stateT > GETUP_T) p.state = 'idle';
        return;
      case 'dead':
        return;
    }

    // idle/walk 移動
    const kb = S.readKeyboard();
    let mx = kb.mx + S.pad.mx;
    let my = kb.my + S.pad.my;
    const len = Math.hypot(mx, my);
    if (len > 1) { mx /= len; my /= len; }
    if (len > 0.01) {
      p.x += mx * PLAYER_SPEED * dt;
      p.y += my * PLAYER_SPEED * 0.7 * dt;
      if (mx !== 0) p.dir = mx > 0 ? 1 : -1;
      p.state = 'walk';
    } else {
      p.state = 'idle';
    }
    p.y = Math.max(0, Math.min(S.yMax, p.y));
    p.x = Math.max(S.cam + 30, Math.min(S.cam + S.viewW - 30, Math.min(p.x, S.stageW - 30)));
    p.hurtCount = Math.max(0, p.hurtCount - dt * 0.4); // 連続被弾カウントは時間で減衰
  }

  // ==== カメラ・描画 ====
  function updateCamera(dt) {
    if (S.lockCam) return;
    const target = Math.max(0, Math.min(S.player.x - S.viewW * 0.42, S.stageW - S.viewW));
    if (target > S.cam) {
      S.cam += Math.min((target - S.cam), 320 * dt);
    }
  }

  function render() {
    // 背景パララックス
    const bgT = `translate3d(${-S.cam * 0.9}px,0,0)`;
    if (S.lastBgT !== bgT) { $('belt-bg').style.transform = bgT; S.lastBgT = bgT; }

    // ※画面外カリング(display:none)は「キャラがランダムに消える」不具合の原因になったため撤去。
    //   軽量化は lowfx(FPS適応) と下の transform/zIndex 差分更新で担保する。
    const all = [S.player, ...S.enemies];
    for (const e of all) {
      const sx = e.x - S.cam - SPR_W / 2;
      const sy = S.groundTop + e.y - SPR_H;
      const t = `translate3d(${sx.toFixed(1)}px,${sy.toFixed(1)}px,0) scaleX(${e.dir}) scale(${(S.gScale * e.scale).toFixed(3)})`;
      if (e.lastTrans !== t) { e.el.style.transform = t; e.lastTrans = t; }
      // 歩きアニメ: x が動いた かつ 特殊状態でない時だけ .walking を付ける(手足が交互に踏む)
      const moved = e.lastX !== undefined && Math.abs(e.x - e.lastX) > 0.15;
      e.lastX = e.x;
      const fc = e.fEl.classList;
      const wantWalk = moved && !(fc.contains('down-pose') || fc.contains('cower') || fc.contains('loiter') || fc.contains('riding') || fc.contains('hit'));
      if (wantWalk !== fc.contains('walking')) fc.toggle('walking', wantWalk);
      // zIndex は y順が変わった時だけ更新(毎フレームの再スタックを避ける)
      const z = 10 + Math.round(e.y);
      if (e.lastZ !== z) { e.el.style.zIndex = z; e.lastZ = z; }
    }
  }

  // ==== 勝敗 ====
  function computeBattleResult() {
    const timeSec = Math.max(1, (performance.now() - S.startT) / 1000);
    const hits = S.stats.hits, maxCombo = S.maxCombo, noHit = S.noHit;
    const timeBonus = Math.max(0, Math.round(60 - timeSec) * 10);   // 60秒以内で時間ボーナス
    const score = hits * 10 + maxCombo * 25 + (noHit ? 800 : 0) + timeBonus;
    let rank = 'C';
    if (score >= 2000 || (noHit && maxCombo >= 10)) rank = 'S';
    else if (score >= 1200) rank = 'A';
    else if (score >= 600) rank = 'B';
    return { score, rank, maxCombo, hits, noHit, timeSec: Math.round(timeSec) };
  }

  function victory() {
    if (S.finished) return;
    S.finished = true;
    log(`${S.boss.data.name}を倒した！`);
    // 名声: 駅制圧=大 ＋ ノーダメ/高コンボ ボーナス
    let fameGain = FAME.boss;
    if (S.noHit) fameGain += 10;
    if (S.maxCombo >= 10) fameGain += 8;
    gainFame(fameGain);
    const bossData = S.boss.data;
    bossData.battleResult = computeBattleResult();   // スコア/ランクを勝利画面へ渡す
    setTimeout(() => { if (S) S.onWin(bossData); }, 1300);
  }

  function defeat() {
    if (S.finished) return;
    S.finished = true;
    log('プレイヤー敗北…');
    setTimeout(() => { if (S) S.onLose(); }, 1300);
  }

  // 軽量化レベル: 1=オーラ/移動レイヤーのfilter除去, 2=さらに影/全画面フィルター除去
  function setFxLevel(n) {
    if (!S) return;
    S.fxLevel = n;
    document.body.classList.toggle('lowfx', n >= 1);
    document.body.classList.toggle('lowfx2', n >= 2);
  }

  // ==== メインループ ====
  function loop(t) {
    if (!S) return;
    const dtRaw = (t - S.lastT) / 1000;
    const dt = Math.min(0.05, dtRaw) || 0.016;
    S.lastT = t;
    // FPS適応: 直近40フレームの平均が重ければエフェクトを段階的に削る
    if (dtRaw > 0 && dtRaw < 0.5) { S.perfAcc += dtRaw; S.perfN++; }
    if (S.perfN >= 24) {
      const avgMs = (S.perfAcc / S.perfN) * 1000;
      S.perfAcc = 0; S.perfN = 0;
      if (avgMs > 22 && S.fxLevel < 2) setFxLevel(S.fxLevel + 1);   // 約45fps未満が続いたら素早く降格
    }
    // ヒットストップ: 強打の瞬間だけゲーム時間を止めて手応えを出す（描画は継続）
    if (S.hitstop > 0) {
      S.hitstop -= dtRaw;
      render();
      S.raf = requestAnimationFrame(loop);
      return;
    }
    updatePlayer(dt);
    S.enemies.forEach(e => updateEnemy(e, dt));
    S.enemies = S.enemies.filter(e => e.state !== 'dead'); // DOM除去はupdateEnemy内のsetTimeoutで実施
    updateCamera(dt);
    updateWaves();
    render();
    S.raf = requestAnimationFrame(loop);
  }

  // ==== 公開API（旧battle.js互換） ====
  function init(enemyData, onWin, onLose, stationId) {
    teardown();
    const gp = window.Game.getPlayer();
    const stage = $('battle-stage');
    const station = window.STATIONS.find(s => s.id === stationId) || {};

    const viewW = stage.clientWidth;
    const stageH = stage.clientHeight;
    S = {
      stationId, station,
      bossData: enemyData,
      onWin, onLose,
      finished: false,
      viewW,
      // 横長画面（PC）でステージが間延びしないよう、1画面分の幅は最大500pxとして計算
      stageW: viewW + Math.min(500, viewW) * (STAGE_SCREENS - 1),
      groundTop: Math.floor(stageH * 0.62),
      yMax: Math.floor(stageH * 0.30),
      gScale: viewW < 600 ? 0.78 : 1,
      cam: 0, lockCam: false,
      enemies: [], boss: null,
      waves: buildWaves(station),
      meter: Math.min(75, ((gp.upgrades && gp.upgrades.meter) || 0) * 25),   // 強化「気合い注入」で初期ゲージ
      upg: (gp.upgrades || {}),   // 戦闘強化ツリー(連撃/一撃必殺/特攻魂)を doPlayerAttack で参照
      hitstop: 0,                 // ヒットストップ(強打の瞬間フリーズ=手応え)
      combo: 0, lastHitAt: 0,
      fame: gp.fame || 0,         // 名声（日和り確率・台詞のfame帯判定に使用）
      playerName: gp.name || 'ボンタン狩り太郎',
      tokens: 2,
      stats: { hits: 0, misses: 0 },
      riderEvents: [{ at: 0.3, done: false }, { at: 0.6, done: false }],
      log: [],
      lastT: performance.now(),
      startT: performance.now(), maxCombo: 0, noHit: true,   // スコア/ランク評価用
      perfAcc: 0, perfN: 0, fxLevel: 0,    // FPS適応の軽量化governor
      pad: { mx: 0, my: 0 },
      readKeyboard: () => ({ mx: 0, my: 0 })
    };
    // モバイル/タッチ端末は最初から軽量モード1で開始（重いエフェクトを抑制）
    const isMobile = viewW < 600 ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    setFxLevel(isMobile ? 1 : 0);

    // ステージ構築
    $('belt-world').innerHTML = '';
    $('damage-numbers').innerHTML = '';
    const oldLabel = stage.querySelector('.belt-label');
    if (oldLabel) oldLabel.remove();
    $('go-arrow').classList.remove('show');
    buildBackground(stationId);

    // ボスHPバーはボス登場まで隠す
    document.querySelector('.hp-bar.enemy-hp').style.visibility = 'hidden';
    document.querySelector('.vs-label').style.visibility = 'hidden';

    // プレイヤー生成
    const player = makeEntity('player', 'player', {
      name: gp.name, hp: gp.hp, atk: gp.atk, speed: PLAYER_SPEED,
      color: '#191921', bontanColor: '#23232c',
      cosmetics: gp.cosmetics   // 主人公の着せ替えを戦闘に反映（applyCharSprite が解釈）
    }, 100, S.yMax * 0.5);
    player.maxHp = gp.maxHp;
    player.dir = 1;
    S.player = player;

    // 雑魚はたむろ集団として最初からステージに配置
    S.waves.forEach((w, wi) => { if (!w.boss) spawnLoiterGroup(w, wi); });

    setupInput();
    updateHpUI();
    updateMeterUI();
    log(`${station.name || ''}駅前に乗り込んだ！ 右へ進め！ ▶`);
    $('go-arrow').classList.add('show');
    setTimeout(() => S && $('go-arrow').classList.remove('show'), 2000);

    S.raf = requestAnimationFrame(loop);
  }

  function teardown() {
    if (!S) return;
    if (S.raf) cancelAnimationFrame(S.raf);
    if (S.abort) S.abort.abort();
    const world = $('belt-world');
    if (world) world.innerHTML = '';
    document.body.classList.remove('lowfx', 'lowfx2');   // 軽量モードを戦闘外へ持ち越さない
    S = null;
  }

  function stop() { teardown(); }

  // 旧API互換（外部から技を出す用：テストでも使用）
  function playerAction(key) { doPlayerAttack(key); }

  // テスト用フック（自動検証で状態を覗く）
  function _debug() {
    if (!S) return null;
    return {
      player: { x: S.player.x, y: S.player.y, hp: S.player.hp, state: S.player.state, dir: S.player.dir, cd: S.player.cdLeft },
      cam: S.cam, lockCam: S.lockCam,
      enemies: S.enemies.map(e => ({ kind: e.kind, x: Math.round(e.x), y: Math.round(e.y), hp: e.hp, state: e.state })),
      waves: S.waves.map(w => w.spawned),
      meter: S.meter, finished: S.finished, stats: S.stats,
      boss: S.boss ? { hp: S.boss.hp, enraged: !!S.boss.enraged } : null
    };
  }
  function _setPad(mx, my) { if (S) { S.pad.mx = mx; S.pad.my = my; } }

  return { init, stop, playerAction, _debug, _setPad };
})();
