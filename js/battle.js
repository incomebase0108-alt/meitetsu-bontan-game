// 戦闘システム（くにおくん風・拡張版）
// - 6コマンド（パンチ/キック/必殺/ガード/突進/投げ）
// - 必殺ゲージ制（ヒット/被弾で溜まりMAXで必殺解放）
// - ジャストガード（敵チャージ予告に合わせると完全無効＋カウンター確定）
// - 連携技（特定の技順で奥義発動）
// - 敵の怒りモード（残りHP35%で攻撃強化・行動加速）
// - 敵アーキタイプ別AI / ガードブレイク / クリティカル / タッチ操作対応
window.Battle = (function() {
  let state = null;

  // アーキタイプ別の見た目（全員リーゼント＋改造学ラン仕様）
  // hair=リーゼント色 / gak=学ラン色(省略時は敵固有色) / acc=肩のアクセサリー
  const VISUALS_BY_ARCHETYPE = {
    'player':        { hair: '#15151c', gak: '#191921', skin: '#f2c899', sarashi: true },
    'yankee-basic':  { hair: '#1a140e' },
    'yankee-fisher': { hair: '#10202a', acc: '🎣' },
    'yankee-fire':   { hair: '#3a0d05', acc: '🔥' },
    'kid-boss':      { hair: '#4a2c10', acc: '🍭', scale: 0.82 },
    'samurai-yanki': { hair: '#0d0d18', acc: '👑', scar: true },
    'matcha-boss':   { hair: '#1c2e10', acc: '🍃', scar: true },
    'girl-yankee':   { hair: '#d4a017', acc: '🎀' },
    'big-boss':      { hair: '#241505', acc: '💪', scale: 1.22, scar: true },
    'final-boss':    { hair: '#ececec', gak: '#f2f0e8', acc: '👑', scar: true, white: true },
    'yakuza':        { hair: '#23201c', gak: '#0c0c10', shades: true, scar: true },
    'gambler-boss':  { hair: '#2c1a3a', acc: '🎲' },
    'thrower-boss':  { hair: '#33200c', acc: '🎯' },
    'onsen-boss':    { hair: '#5a4a42', acc: '♨️' },
    'riezent-boss':  { hair: '#050505', acc: '💈', pompXL: true },
    'karate-boss':   { hair: '#1a1a1a', acc: '🥋', scar: true }
  };

  // リーゼント頭のHTML（CSSで描画）
  function delinquentHeadHTML(v) {
    return `
      <div class="dq-face">
        <div class="dq-brow l"></div><div class="dq-brow r"></div>
        ${v.shades ? '<div class="dq-shades"></div>' : '<div class="dq-eye l"></div><div class="dq-eye r"></div>'}
        <div class="dq-mouth"></div>
        ${v.scar ? '<div class="dq-scar"></div>' : ''}
      </div>
      <div class="dq-hair${v.pompXL ? ' xl' : ''}"><div class="dq-pomp"></div></div>`;
  }

  function applyCharSprite(charEl, archetypeId, data) {
    const body = charEl.querySelector('.char-body');
    const head = charEl.querySelector('.char-head');
    const pants = charEl.querySelector('.char-pants');
    const accessory = charEl.querySelector('.char-accessory');

    // 既存imgを除去
    const oldImg = charEl.querySelector('img.char-sprite');
    if (oldImg) oldImg.remove();

    const v = VISUALS_BY_ARCHETYPE[archetypeId] || VISUALS_BY_ARCHETYPE['yankee-basic'];

    // アクセサリー（アーキタイプ固有 > 敵固有emoji）
    if (accessory) accessory.textContent = v.acc || data.emoji || '';

    const imgPath = `assets/characters/${archetypeId}.png`;
    const img = new Image();
    img.onload = () => {
      const sprite = document.createElement('img');
      sprite.src = imgPath;
      sprite.className = 'char-sprite';
      charEl.appendChild(sprite);
      head.style.display = 'none';
      body.style.display = 'none';
      pants.style.display = 'none';
    };
    img.onerror = () => {
      head.style.display = '';
      body.style.display = '';
      pants.style.display = '';
      // CSS不良スプライト構築
      charEl.classList.add('dq');
      charEl.style.setProperty('--hair', v.hair || '#15110c');
      charEl.style.setProperty('--gak', v.gak || data.color || '#23232b');
      charEl.style.setProperty('--skin', v.skin || '#f0c08a');
      charEl.style.setProperty('--bontan', data.bontanColor || '#1a1a1a');
      head.innerHTML = delinquentHeadHTML(v);
      body.innerHTML = v.sarashi ? '<div class="dq-sarashi"></div>' : '';
      body.classList.toggle('white-gak', !!v.white);
      // ボス・大型キャラはちょっと大きく
      const sc = v.scale || (data.isBig ? 1.22 : 1);
      charEl.style.zoom = sc;
    };
    img.src = imgPath;
  }

  function renderScene(stationId) {
    const scene = (window.SCENES && window.SCENES[stationId]) || null;
    const bg = document.getElementById('battle-bg');
    bg.innerHTML = '';
    if (!scene) {
      bg.style.background = 'linear-gradient(180deg, #4a6fa5 0%, #7a9fcf 60%, #5a7a3a 60%, #3a5a1a 100%)';
      return;
    }
    const gh = scene.groundH || 35;
    bg.style.background = `${scene.sky}`;
    const ground = document.createElement('div');
    ground.className = 'scene-ground';
    ground.style.cssText = `position:absolute; left:0; right:0; bottom:0; height:${gh}%; background:${scene.ground}; z-index:1;`;
    bg.appendChild(ground);
    const label = document.createElement('div');
    label.className = 'scene-label';
    label.textContent = scene.name;
    bg.appendChild(label);
    (scene.deco || []).forEach(d => {
      const el = document.createElement('div');
      el.className = 'scene-deco';
      el.textContent = d.e;
      el.style.cssText = `position:absolute; left:${d.x}%; top:${d.y}%; font-size:${d.s}px; transform:translate(-50%,-50%) ${d.r ? `rotate(${d.r}deg)` : ''}; z-index:${d.y > (100 - gh) ? 2 : 1}; user-select:none; pointer-events:none;`;
      bg.appendChild(el);
    });
  }

  // 敵アーキタイプ別の攻撃パターン
  // weights: 重み（多いほど選ばれる）、cooldown独自、特殊効果
  const ENEMY_PATTERNS = {
    'yankee-basic': [
      { name: 'パンチ', mult: 1.0, hit: 0.85, weight: 5, text: 'WHACK!', anim: 'punch' },
      { name: 'キック', mult: 1.4, hit: 0.7,  weight: 3, text: 'BAM!',  anim: 'kick' }
    ],
    'yankee-fisher': [
      { name: '釣り竿スイング', mult: 1.2, hit: 0.8, weight: 4, text: 'WHIP!', anim: 'punch' },
      { name: '網投げ', mult: 1.5, hit: 0.6, weight: 3, text: 'NET!', anim: 'kick', breakGuard: true },
      { name: 'ガード', mult: 0, hit: 1.0, weight: 1, text: '', anim: 'guard', guard: true }
    ],
    'yankee-fire': [
      { name: '火炎パンチ', mult: 1.3, hit: 0.75, weight: 4, text: 'BURN!', anim: 'punch' },
      { name: '火の粉キック', mult: 1.7, hit: 0.65, weight: 3, text: 'BLAZE!', anim: 'kick' },
      { name: '燃え盛る突進', mult: 2.0, hit: 0.55, weight: 2, text: 'INFERNO!!', anim: 'dash' }
    ],
    'kid-boss': [
      { name: '頭突き', mult: 0.9, hit: 0.9, weight: 5, text: 'BONK!', anim: 'punch' },
      { name: '体当たり', mult: 1.3, hit: 0.7, weight: 3, text: 'BUMP!', anim: 'dash' },
      { name: 'ベロベロバー', mult: 0.5, hit: 0.95, weight: 2, text: 'BLEH!', anim: 'punch' }
    ],
    'samurai-yanki': [
      { name: '木刀斬り', mult: 1.5, hit: 0.8, weight: 4, text: 'SLASH!', anim: 'kick' },
      { name: '居合斬り', mult: 2.5, hit: 0.55, weight: 2, text: 'IAI!!', anim: 'special', breakGuard: true },
      { name: '構え', mult: 0, hit: 1.0, weight: 1, text: '', anim: 'guard', guard: true }
    ],
    'matcha-boss': [
      { name: '茶碗投げ', mult: 1.4, hit: 0.8, weight: 4, text: 'SMASH!', anim: 'throw' },
      { name: '熱い抹茶', mult: 1.8, hit: 0.7, weight: 3, text: 'HOT!!', anim: 'special' },
      { name: '茶筅乱舞', mult: 1.2, hit: 0.85, weight: 3, text: 'WHISK!', anim: 'punch' },
      { name: 'ガード', mult: 0, hit: 1.0, weight: 1, text: '', anim: 'guard', guard: true }
    ],
    'girl-yankee': [
      { name: 'ビンタ', mult: 0.9, hit: 0.95, weight: 4, text: 'SLAP!', anim: 'punch' },
      { name: 'ハイヒールキック', mult: 1.8, hit: 0.7, weight: 3, text: 'HEEL!!', anim: 'kick' },
      { name: '髪の毛つかみ', mult: 1.3, hit: 0.85, weight: 2, text: 'GRAB!', anim: 'throw' }
    ],
    'big-boss': [
      { name: '怪力パンチ', mult: 1.5, hit: 0.85, weight: 4, text: 'CRUSH!', anim: 'punch' },
      { name: '振り回し', mult: 2.2, hit: 0.6, weight: 3, text: 'SPIN!!', anim: 'throw', breakGuard: true },
      { name: '地響きストンプ', mult: 1.8, hit: 0.75, weight: 2, text: 'STOMP!!', anim: 'kick' }
    ],
    'final-boss': [
      { name: '王者の拳', mult: 1.4, hit: 0.9, weight: 4, text: 'KING!', anim: 'punch' },
      { name: '名鉄旋風脚', mult: 2.0, hit: 0.7, weight: 3, text: 'MEITETSU!!', anim: 'kick' },
      { name: '総長の一撃', mult: 3.0, hit: 0.55, weight: 2, text: 'SOUCHOU!!!', anim: 'special', breakGuard: true },
      { name: '突進', mult: 1.8, hit: 0.8, weight: 2, text: 'CHARGE!', anim: 'dash' }
    ],
    'yakuza': [
      { name: '懐から出す', mult: 1.5, hit: 0.85, weight: 3, text: 'BLAM!', anim: 'special' },
      { name: '組長の威圧', mult: 2.0, hit: 0.7, weight: 3, text: 'PRESSURE!!', anim: 'dash', breakGuard: true },
      { name: '指詰めキック', mult: 2.5, hit: 0.55, weight: 2, text: 'YUBI!!', anim: 'kick' }
    ],
    'gambler-boss': [
      { name: 'イカサマパンチ', mult: 1.1, hit: 0.9, weight: 4, text: 'JACKPOT!', anim: 'punch' },
      { name: 'コイン投げ', mult: 1.4, hit: 0.8, weight: 3, text: 'CHIP!!', anim: 'throw' },
      { name: 'ハッタリ突進', mult: 1.8, hit: 0.65, weight: 2, text: 'BLUFF!!', anim: 'dash', breakGuard: true },
      { name: 'ポーカーフェイス', mult: 0, hit: 1.0, weight: 1, text: '', anim: 'guard', guard: true }
    ],
    'thrower-boss': [
      { name: '連投', mult: 0.8, hit: 0.95, weight: 5, text: 'TOSS!', anim: 'throw' },
      { name: '剛速球', mult: 1.8, hit: 0.7, weight: 3, text: 'FAST!!', anim: 'throw' },
      { name: '皮で滑らす', mult: 1.2, hit: 0.85, weight: 2, text: 'SLIP!', anim: 'kick' }
    ],
    'onsen-boss': [
      { name: '湯気目つぶし', mult: 1.0, hit: 0.95, weight: 4, text: 'STEAM!', anim: 'special' },
      { name: '湯桶投げ', mult: 1.5, hit: 0.75, weight: 3, text: 'BUCKET!', anim: 'throw' },
      { name: 'のぼせ拳', mult: 2.0, hit: 0.6, weight: 2, text: 'BOIL!!', anim: 'punch', breakGuard: true },
      { name: '湯けむり防御', mult: 0, hit: 1.0, weight: 1, text: '', anim: 'guard', guard: true }
    ],
    'riezent-boss': [
      { name: 'リーゼントヘッド', mult: 1.3, hit: 0.85, weight: 4, text: 'POMADE!', anim: 'punch' },
      { name: '櫛投げ', mult: 1.2, hit: 0.9, weight: 3, text: 'COMB!', anim: 'throw' },
      { name: '逆毛逆襲', mult: 2.2, hit: 0.65, weight: 2, text: 'REVERSE!!', anim: 'dash', breakGuard: true }
    ],
    'karate-boss': [
      { name: '正拳突き', mult: 1.4, hit: 0.85, weight: 4, text: 'SEIKEN!', anim: 'punch' },
      { name: '上段蹴り', mult: 1.8, hit: 0.7, weight: 3, text: 'MAWASHI!!', anim: 'kick' },
      { name: '型', mult: 0, hit: 1.0, weight: 1, text: '', anim: 'guard', guard: true },
      { name: '瓦割り掌', mult: 2.5, hit: 0.6, weight: 2, text: 'KAWARA!!', anim: 'special', breakGuard: true }
    ]
  };

  // 戦闘中の不良煽りセリフ（吹き出し表示）
  const TAUNTS = [
    'おうおう、ビビっとんのか？',
    'その程度かよ三河の喧嘩は！',
    'ボンタンは渡さねぇぞコラ！',
    '歯ァ食いしばれや！',
    '上等じゃねぇか…！',
    'テメェのリーゼント、へし折ったる！',
    '夜露死苦ぅ！！'
  ];

  // 連携技（この順で連続ヒットさせると発動）
  const CHAINS = [
    { seq: ['punch', 'punch', 'kick'], name: '喧嘩殺法・三連蹴り', mult: 1.5 },
    { seq: ['punch', 'kick', 'throw'], name: '奥義・ボンタン三段崩し', mult: 1.8 },
    { seq: ['kick', 'kick', 'dash'],   name: '特攻・轟雷タックル', mult: 1.6 },
    { seq: ['dash', 'punch', 'throw'], name: '裏技・通り魔バックドロップ', mult: 1.7 }
  ];

  function init(enemyData, onWin, onLose, stationId) {
    const player = window.Game.getPlayer();
    state = {
      player: {
        hp: player.hp, maxHp: player.maxHp, atk: player.atk,
        guarding: false, busy: false, combo: 0, lastHitAt: 0,
        meter: 0, counterReady: false, justGuardArmed: false, chain: []
      },
      enemy: {
        ...enemyData, maxHp: enemyData.hp, currentHp: enemyData.hp,
        busy: false, guarding: false, archetypeId: enemyData.archetypeId || 'yankee-basic',
        atkBoost: 1, telegraphing: false, enraged: false, stunnedUntil: 0
      },
      log: [],
      onWin,
      onLose,
      finished: false,
      stationId
    };

    renderScene(stationId);
    document.getElementById('enemy-name').textContent = enemyData.name;
    const enemyChar = document.getElementById('enemy-char');
    enemyChar.classList.remove('defeated', 'hit', 'pantsless', 'thrown', 'knockback', 'guarding', 'charging', 'aura-active');
    enemyChar.style.setProperty('--body', enemyData.color);
    applyCharSprite(enemyChar, enemyData.archetypeId, enemyData);

    const playerChar = document.getElementById('player-char');
    playerChar.classList.remove('defeated', 'hit', 'pantsless', 'thrown', 'knockback', 'guarding', 'charging', 'aura-active');
    applyCharSprite(playerChar, 'player', { color: '#191921', emoji: '', bontanColor: '#23232c' });

    if (enemyData.isRare) {
      log(`<span style="color:#ff3366; font-weight:bold">⚠️ レアエンカウント！本物の極道が現れた！</span>`);
    }
    log(`${enemyData.title}「${enemyData.name}」が現れた！`);
    log(`「${enemyData.voice}」`);
    setTimeout(() => { if (state && !state.finished) showTaunt(enemyData.voice); }, 300);
    updateUI();
    updateMeterUI();

    // 全ボタンをアクティブに
    document.querySelectorAll('.action-btn').forEach(b => {
      b.disabled = false;
      b.classList.remove('cooling');
    });
    document.getElementById('combo-display').classList.remove('show', 'chain');

    // Enemy AI loop（少しランダム性）
    scheduleEnemyAction();
  }

  function scheduleEnemyAction() {
    if (!state || state.finished) return;
    // 敵speedが高いほど行動が速い。怒りモードでさらに加速
    let delay = Math.max(650, 1350 - (state.enemy.speed || 5) * 35) + Math.random() * 500;
    if (state.enemy.enraged) delay *= 0.72;
    state.enemyTimer = setTimeout(() => {
      enemyAction();
      scheduleEnemyAction();
    }, delay);
  }

  function log(msg) {
    state.log.push(msg);
    const el = document.getElementById('battle-log');
    el.innerHTML = state.log.slice(-3).map(m => `<div>${m}</div>`).join('');
    el.scrollTop = el.scrollHeight;
  }

  function updateUI() {
    const p = state.player, e = state.enemy;
    const pPct = Math.max(0, (p.hp / p.maxHp) * 100);
    const ePct = Math.max(0, (e.currentHp / e.maxHp) * 100);
    document.getElementById('player-hp-fill').style.width = pPct + '%';
    document.getElementById('enemy-hp-fill').style.width = ePct + '%';
    document.getElementById('player-hp-text').textContent = `${Math.max(0, Math.ceil(p.hp))}/${p.maxHp}`;
    document.getElementById('enemy-hp-text').textContent = `${Math.max(0, Math.ceil(e.currentHp))}/${e.maxHp}`;
  }

  // 必殺ゲージ
  function gainMeter(n) {
    if (!state) return;
    const p = state.player;
    const was = p.meter;
    p.meter = Math.min(100, p.meter + n);
    updateMeterUI();
    if (was < 100 && p.meter >= 100) {
      log('<span style="color:#ffcc00; font-weight:bold">🔥 必殺ゲージMAX！！ぶちかませ！</span>');
      window.Audio8 && window.Audio8.SFX.levelup && window.Audio8.SFX.levelup();
    }
  }

  function updateMeterUI() {
    const fill = document.getElementById('meter-fill');
    const txt = document.getElementById('meter-text');
    const pct = state ? Math.floor(state.player.meter) : 0;
    if (fill) fill.style.width = pct + '%';
    if (txt) txt.textContent = pct + '%';
    const btn = document.querySelector('.action-btn.act-special');
    if (btn) btn.classList.toggle('ready', pct >= 100);
  }

  function showHit(targetSelector, text) {
    const target = document.querySelector(targetSelector);
    const stage = document.getElementById('battle-stage');
    const fx = document.getElementById('hit-effect');
    const rect = target.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    fx.textContent = text;
    fx.style.left = (rect.left - stageRect.left + 20) + 'px';
    fx.style.top = (rect.top - stageRect.top - 20) + 'px';
    fx.classList.remove('show');
    void fx.offsetWidth;
    fx.classList.add('show');
  }

  function showDamageNumber(targetSelector, dmg, type) {
    const target = document.querySelector(targetSelector);
    const stage = document.getElementById('battle-stage');
    const dn = document.getElementById('damage-numbers');
    const rect = target.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'damage-num';
    if (type === 'critical') el.classList.add('critical');
    if (type === 'miss') el.classList.add('miss');
    el.textContent = type === 'miss' ? 'MISS' : (type === 'critical' ? `${dmg}!` : `${dmg}`);
    el.style.left = (rect.left - stageRect.left + 20 + Math.random() * 30 - 15) + 'px';
    el.style.top = (rect.top - stageRect.top + 30) + 'px';
    dn.appendChild(el);
    setTimeout(() => el.remove(), 850);
  }

  function flashScreen() {
    const flash = document.getElementById('screen-flash');
    flash.classList.remove('show');
    void flash.offsetWidth;
    flash.classList.add('show');
  }

  function shakeStage() {
    const stage = document.getElementById('battle-stage');
    stage.classList.remove('shake');
    void stage.offsetWidth;
    stage.classList.add('shake');
  }

  function showCombo(n) {
    const el = document.getElementById('combo-display');
    if (n < 2) { el.classList.remove('show', 'chain'); return; }
    el.classList.remove('chain');
    el.textContent = `${n} HIT COMBO!`;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }

  function showChainName(name) {
    const el = document.getElementById('combo-display');
    el.textContent = `連携「${name}」！！`;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show', 'chain');
  }

  // 敵の吹き出しセリフ
  function showTaunt(text) {
    const stage = document.getElementById('battle-stage');
    const enemyChar = document.getElementById('enemy-char');
    if (!stage || !enemyChar || !text) return;
    const old = stage.querySelector('.speech-bubble');
    if (old) old.remove();
    const b = document.createElement('div');
    b.className = 'speech-bubble';
    b.textContent = text;
    const rect = enemyChar.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    b.style.right = Math.max(4, stageRect.right - rect.right) + 'px';
    b.style.top = Math.max(4, rect.top - stageRect.top - 44) + 'px';
    stage.appendChild(b);
    setTimeout(() => b.remove(), 1800);
  }

  // 怒りモード（残りHP35%で1回だけ発動）
  function checkEnrage() {
    const e = state.enemy;
    if (!e.enraged && e.currentHp > 0 && e.currentHp / e.maxHp < 0.35) {
      e.enraged = true;
      e.atkBoost = 1.25;
      document.getElementById('enemy-char').classList.add('aura-active');
      log(`<span style="color:#ff3366; font-weight:bold">${e.name}の目の色が変わった！！</span>`);
      showTaunt('キレちまったぜ…ここからが本番じゃ！');
      window.Audio8 && window.Audio8.SFX.guardBreak && window.Audio8.SFX.guardBreak();
    }
  }

  // プレイヤー攻撃
  const ACTIONS = {
    punch:   { name: 'パンチ', mult: 1.0, hit: 0.92, cd: 320,  text: 'BAM!',    sfx: 'punch',   anim: 'punch',   crit: 0.1 },
    kick:    { name: 'キック', mult: 1.6, hit: 0.78, cd: 580,  text: 'BOOM!',   sfx: 'kick',    anim: 'kick',    crit: 0.15 },
    special: { name: '必殺技', mult: 3.2, hit: 0.95, cd: 1200, text: 'WHAM!!',  sfx: 'special', anim: 'special', crit: 0.3, flash: true, useMeter: true },
    guard:   { name: 'ガード', mult: 0,   hit: 1.0, cd: 700,  text: '',        sfx: 'guard',   anim: null,      crit: 0 },
    dash:    { name: '突進',   mult: 2.0, hit: 0.85, cd: 800,  text: 'CHARGE!', sfx: 'dash',    anim: 'dash',    crit: 0.15 },
    throw:   { name: '投げ',   mult: 1.8, hit: 0.8, cd: 1000, text: 'GRAB!!',  sfx: 'throw',   anim: 'throw',   crit: 0.1, breakGuard: true }
  };

  function playerAction(actionKey) {
    if (!state || state.finished || state.player.busy) return;
    const action = ACTIONS[actionKey];
    if (!action) return;

    // 必殺技はゲージMAXでのみ発動
    if (action.useMeter && state.player.meter < 100) {
      log('気合いが足りねぇ…（必殺ゲージMAXで発動）');
      window.Audio8 && window.Audio8.SFX.miss();
      return;
    }

    state.player.busy = true;
    state.player.guarding = (actionKey === 'guard');

    const playerChar = document.getElementById('player-char');
    playerChar.classList.remove('act-punch', 'act-kick', 'act-special', 'act-dash', 'act-throw', 'guarding');
    if (action.anim) {
      playerChar.classList.add('act-' + action.anim);
      setTimeout(() => playerChar.classList.remove('act-' + action.anim), 700);
    } else if (actionKey === 'guard') {
      playerChar.classList.add('guarding');
    }

    window.Audio8 && window.Audio8.SFX[action.sfx] && window.Audio8.SFX[action.sfx]();

    // ボタンクールダウン
    const btn = document.querySelector(`.action-btn[data-action="${actionKey}"]`);
    if (btn) {
      btn.classList.add('cooling');
      btn.style.setProperty('--cd', action.cd + 'ms');
      setTimeout(() => btn.classList.remove('cooling'), action.cd);
    }

    if (actionKey === 'guard') {
      // ジャストガード判定：敵のチャージ予告中にガードを合わせる
      if (state.enemy.telegraphing) {
        state.player.justGuardArmed = true;
        log(`<span style="color:#66ccff; font-weight:bold">⚡ ジャストガードの構え！！</span>`);
      } else {
        log(`プレイヤーはガード体勢！`);
      }
    } else {
      // 必殺技はゲージ消費
      if (action.useMeter) {
        state.player.meter = 0;
        updateMeterUI();
      }

      // 命中判定
      const enemyGuarding = state.enemy.guarding && !action.breakGuard;
      let hitRoll = Math.random();
      if (enemyGuarding) hitRoll += 0.2; // ガード中は当てづらい

      if (hitRoll < action.hit) {
        let baseDmg = state.player.atk * action.mult;
        // クリティカル（ジャストガード後のカウンターは確定クリティカル）
        let isCrit = Math.random() < action.crit;
        if (state.player.counterReady) {
          isCrit = true;
          state.player.counterReady = false;
          playerChar.classList.remove('aura-active');
          log(`<span style="color:#66ccff; font-weight:bold">カウンター炸裂！！</span>`);
        }
        if (isCrit) baseDmg *= 1.8;
        let dmg = Math.max(1, Math.floor(baseDmg + Math.random() * 4 - 2));
        // 敵ガード貫通でも軽減
        if (state.enemy.guarding && action.breakGuard) {
          // ガードブレイク発動
          state.enemy.guarding = false;
          document.getElementById('enemy-char').classList.remove('guarding');
          window.Audio8 && window.Audio8.SFX.guardBreak();
          log(`<span style="color:#ff3366">ガードブレイク！</span>`);
        }
        // コンボ判定（前回ヒットから1.2秒以内）
        const now = Date.now();
        if (now - state.player.lastHitAt < 1200) {
          state.player.combo++;
          // コンボボーナス（最大+50%）
          dmg = Math.floor(dmg * (1 + Math.min(0.5, state.player.combo * 0.08)));
        } else {
          state.player.combo = 1;
          state.player.chain = [];
        }
        state.player.lastHitAt = now;

        // 連携技判定（コンボ継続中に特定の技順）
        state.player.chain.push(actionKey);
        if (state.player.chain.length > 3) state.player.chain.shift();
        let chainHit = null;
        if (state.player.combo >= 3) {
          chainHit = CHAINS.find(c =>
            c.seq.length <= state.player.chain.length &&
            c.seq.every((k, i) => state.player.chain[state.player.chain.length - c.seq.length + i] === k)
          );
        }
        if (chainHit) {
          dmg = Math.floor(dmg * chainHit.mult);
          state.player.chain = [];
          showChainName(chainHit.name);
          flashScreen();
          shakeStage();
          window.Audio8 && window.Audio8.SFX.special();
          log(`<span style="color:#ffcc00; font-weight:bold">連携「${chainHit.name}」発動！！</span>`);
          gainMeter(12);
        } else {
          showCombo(state.player.combo);
        }
        window.Audio8 && window.Audio8.SFX.combo(state.player.combo);

        state.enemy.currentHp -= dmg;
        gainMeter(Math.round(action.cd / 40)); // 重い技ほどゲージが溜まる
        const enemyChar = document.getElementById('enemy-char');
        enemyChar.classList.remove('hit', 'knockback');
        void enemyChar.offsetWidth;
        enemyChar.classList.add(action.mult >= 2.5 ? 'knockback' : 'hit');
        setTimeout(() => enemyChar.classList.remove('hit', 'knockback'), 400);

        setTimeout(() => window.Audio8 && window.Audio8.SFX[isCrit ? 'critical' : 'hit'](), 80);
        if (action.flash || isCrit) flashScreen();
        if (isCrit || action.mult >= 2.5 || chainHit) shakeStage();
        showHit('#enemy-char', isCrit ? 'CRITICAL!' : action.text);
        showDamageNumber('#enemy-char', dmg, isCrit ? 'critical' : 'normal');

        log(`プレイヤー ${action.name}！ ${dmg}ダメージ${isCrit ? '【会心の一撃！】' : ''}`);
        checkEnrage();
        checkVictory();
      } else {
        window.Audio8 && window.Audio8.SFX.miss();
        showDamageNumber('#enemy-char', 0, 'miss');
        log(`プレイヤーの${action.name}は外れた…`);
        state.player.combo = 0;
        state.player.chain = [];
        showCombo(0);
      }
    }

    updateUI();
    setTimeout(() => {
      state.player.busy = false;
      if (state.player.guarding) {
        state.player.guarding = false;
        playerChar.classList.remove('guarding');
      }
    }, action.cd);
  }

  // 敵の重み付き行動選択
  function chooseEnemyAction() {
    const arch = state.enemy.archetypeId;
    const patterns = ENEMY_PATTERNS[arch] || ENEMY_PATTERNS['yankee-basic'];
    // 体力少ない時はガード/構え行動の重みを上げる
    const lowHp = state.enemy.currentHp / state.enemy.maxHp < 0.3;
    const totalWeight = patterns.reduce((sum, p) => sum + (p.guard && lowHp ? p.weight * 3 : p.weight), 0);
    let r = Math.random() * totalWeight;
    for (const p of patterns) {
      const w = p.guard && lowHp ? p.weight * 3 : p.weight;
      if (r < w) return p;
      r -= w;
    }
    return patterns[0];
  }

  function enemyAction() {
    if (!state || state.finished || state.enemy.busy) return;
    // ジャストガードで気絶中は行動不能
    if (state.enemy.stunnedUntil && Date.now() < state.enemy.stunnedUntil) return;
    state.enemy.busy = true;
    const action = chooseEnemyAction();
    const enemyChar = document.getElementById('enemy-char');
    enemyChar.classList.remove('act-punch', 'act-kick', 'act-special', 'act-dash', 'act-throw', 'guarding');

    if (action.guard) {
      // ガード行動
      state.enemy.guarding = true;
      enemyChar.classList.add('guarding');
      window.Audio8 && window.Audio8.SFX.guard();
      log(`${state.enemy.name}は構えた…`);
      setTimeout(() => {
        state.enemy.guarding = false;
        enemyChar.classList.remove('guarding');
      }, 1500);
      setTimeout(() => { state.enemy.busy = false; }, 800);
      return;
    }

    // チャージ予告（強い攻撃時）→ この間にガードを押すとジャストガード！
    if (action.mult >= 2.0) {
      state.enemy.telegraphing = true;
      enemyChar.classList.add('charging');
      log(`<span style="color:#ff9966">${state.enemy.name}が力を溜めている…！（今だ、ガード！）</span>`);
      setTimeout(() => {
        state.enemy.telegraphing = false;
        enemyChar.classList.remove('charging');
        executeEnemyAttack(action);
      }, 800);
    } else {
      executeEnemyAttack(action);
    }
  }

  function executeEnemyAttack(action) {
    if (!state || state.finished) return;
    const enemyChar = document.getElementById('enemy-char');

    // ジャストガード成立：完全無効＋敵気絶＋カウンター確定
    if (state.player.justGuardArmed) {
      state.player.justGuardArmed = false;
      state.player.counterReady = true;
      state.enemy.stunnedUntil = Date.now() + 1600;
      const playerChar = document.getElementById('player-char');
      playerChar.classList.add('aura-active');
      enemyChar.classList.remove('hit');
      void enemyChar.offsetWidth;
      enemyChar.classList.add('hit');
      setTimeout(() => enemyChar.classList.remove('hit'), 400);
      window.Audio8 && window.Audio8.SFX.critical();
      flashScreen();
      shakeStage();
      showHit('#player-char', 'JUST GUARD!!');
      gainMeter(30);
      log(`<span style="color:#66ccff; font-weight:bold">⚡ ジャストガード成功！！${state.enemy.name}は体勢を崩した！（次の攻撃は確定クリティカル）</span>`);
      updateUI();
      setTimeout(() => { state.enemy.busy = false; }, 500);
      return;
    }

    enemyChar.classList.add('act-' + action.anim);
    setTimeout(() => enemyChar.classList.remove('act-' + action.anim), 700);

    // 効果音
    const sfxMap = { punch: 'punch', kick: 'kick', special: 'special', dash: 'dash', throw: 'throw' };
    const sfxName = sfxMap[action.anim] || 'punch';
    window.Audio8 && window.Audio8.SFX[sfxName] && window.Audio8.SFX[sfxName]();

    // 命中判定
    let effectiveHit = action.hit;
    if (state.player.guarding && !action.breakGuard) {
      effectiveHit *= 0.7; // ガード中は当たりにくい
    }

    if (Math.random() < effectiveHit) {
      let dmg = Math.floor(state.enemy.atk * (state.enemy.atkBoost || 1) * action.mult * (0.9 + Math.random() * 0.3));
      // ガード貫通
      if (state.player.guarding && action.breakGuard) {
        state.player.guarding = false;
        document.getElementById('player-char').classList.remove('guarding');
        window.Audio8 && window.Audio8.SFX.guardBreak();
        log(`<span style="color:#ff3366">ガードを破られた！</span>`);
        // ガード貫通は通常ダメージ
      } else if (state.player.guarding) {
        dmg = Math.max(1, Math.floor(dmg * 0.2));
      }

      state.player.hp -= dmg;
      gainMeter(10); // 被弾でも闘志が溜まる
      // コンボリセット
      state.player.combo = 0;
      state.player.chain = [];
      showCombo(0);

      const playerChar = document.getElementById('player-char');
      playerChar.classList.remove('hit', 'knockback');
      void playerChar.offsetWidth;
      playerChar.classList.add(action.mult >= 2.5 ? 'knockback' : 'hit');
      setTimeout(() => playerChar.classList.remove('hit', 'knockback'), 400);

      setTimeout(() => window.Audio8 && window.Audio8.SFX.hit(), 80);
      if (action.mult >= 2.5) { flashScreen(); shakeStage(); }
      showHit('#player-char', action.text);
      showDamageNumber('#player-char', dmg, action.mult >= 2.5 ? 'critical' : 'normal');
      log(`${state.enemy.name}の${action.name}！ ${dmg}ダメージ！`);
      // たまに煽ってくる
      if (Math.random() < 0.22) {
        showTaunt(TAUNTS[Math.floor(Math.random() * TAUNTS.length)]);
      }
      checkDefeat();
    } else {
      showDamageNumber('#player-char', 0, 'miss');
      log(`${state.enemy.name}の${action.name}を回避！`);
    }

    updateUI();
    setTimeout(() => { state.enemy.busy = false; }, 500);
  }

  function checkVictory() {
    if (state.enemy.currentHp <= 0 && !state.finished) {
      state.finished = true;
      clearTimeout(state.enemyTimer);
      document.getElementById('enemy-char').classList.add('defeated');
      log(`${state.enemy.name}を倒した！`);
      setTimeout(() => state.onWin(state.enemy), 1200);
    }
  }

  function checkDefeat() {
    if (state.player.hp <= 0 && !state.finished) {
      state.finished = true;
      clearTimeout(state.enemyTimer);
      document.getElementById('player-char').classList.add('defeated');
      log(`プレイヤー敗北…`);
      setTimeout(() => state.onLose(), 1200);
    }
  }

  function stop() {
    if (state && state.enemyTimer) clearTimeout(state.enemyTimer);
    state = null;
  }

  return { init, playerAction, stop, delinquentHeadHTML, VISUALS_BY_ARCHETYPE };
})();

// ==== 入力ハンドラ ====
// キーボード
document.addEventListener('keydown', (e) => {
  if (!document.getElementById('screen-battle').classList.contains('active')) return;
  const map = { 'a': 'punch', 's': 'kick', 'd': 'special', 'f': 'guard', 'w': 'dash', 'e': 'throw' };
  const action = map[e.key.toLowerCase()];
  if (action) { e.preventDefault(); window.Battle.playerAction(action); }
});

// ボタンタップ（touchstart で即応答、click は併用）
function bindActionButton(btn) {
  let handled = false;
  const trigger = (e) => {
    e.preventDefault();
    if (handled) return;
    handled = true;
    setTimeout(() => { handled = false; }, 100);
    window.Audio8 && window.Audio8.resumeIfSuspended && window.Audio8.resumeIfSuspended();
    window.Battle.playerAction(btn.dataset.action);
  };
  btn.addEventListener('touchstart', trigger, { passive: false });
  btn.addEventListener('click', trigger);
}
document.querySelectorAll('.action-btn').forEach(bindActionButton);

// スワイプ操作（戦闘画面でスワイプ）
(function setupSwipe() {
  const stage = document.getElementById('battle-stage');
  if (!stage) return;
  let sx = 0, sy = 0, st = 0;
  stage.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    sx = t.clientX; sy = t.clientY; st = Date.now();
  }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (!document.getElementById('screen-battle').classList.contains('active')) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - sx;
    const dy = t.clientY - sy;
    const dt = Date.now() - st;
    if (dt > 600) return;
    const absX = Math.abs(dx), absY = Math.abs(dy);
    if (absX < 30 && absY < 30) {
      // タップでパンチ
      window.Battle.playerAction('punch');
      return;
    }
    // スワイプ方向で技決定
    if (absX > absY) {
      // 横スワイプ
      if (dx > 0) window.Battle.playerAction('dash');   // 右：突進
      else window.Battle.playerAction('throw');         // 左：投げ
    } else {
      // 縦スワイプ
      if (dy < 0) window.Battle.playerAction('special'); // 上：必殺技
      else window.Battle.playerAction('guard');          // 下：ガード
    }
  }, { passive: true });
})();
