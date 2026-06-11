// 戦闘システム（くにおくん風・拡張版）
// - 6コマンド（パンチ/キック/必殺/ガード/突進/投げ）
// - コンボシステム
// - 敵アーキタイプ別AI
// - ガードブレイク・クリティカル
// - タッチ操作対応
window.Battle = (function() {
  let state = null;

  // アクセサリーemoji（アーキタイプごとの装飾）
  const ACCESSORY_BY_ARCHETYPE = {
    'yankee-basic':  { acc: '' },
    'yankee-fisher': { acc: '🎣' },
    'yankee-fire':   { acc: '🔥' },
    'kid-boss':      { acc: '🍭' },
    'samurai-yanki': { acc: '👑' },
    'matcha-boss':   { acc: '🍃' },
    'girl-yankee':   { acc: '🎀' },
    'big-boss':      { acc: '💪' },
    'final-boss':    { acc: '👑' },
    'yakuza':        { acc: '🕶' },
    'gambler-boss':  { acc: '🎲' },
    'thrower-boss':  { acc: '🎯' },
    'onsen-boss':    { acc: '♨️' },
    'riezent-boss':  { acc: '💈' },
    'karate-boss':   { acc: '🥋' },
    'player':        { acc: '' }
  };

  function applyCharSprite(charEl, archetypeId, data) {
    const body = charEl.querySelector('.char-body');
    const head = charEl.querySelector('.char-head');
    const pants = charEl.querySelector('.char-pants');
    const accessory = charEl.querySelector('.char-accessory');

    // 既存imgを除去
    const oldImg = charEl.querySelector('img.char-sprite');
    if (oldImg) oldImg.remove();

    // アクセサリー設定
    const accInfo = ACCESSORY_BY_ARCHETYPE[archetypeId] || ACCESSORY_BY_ARCHETYPE['yankee-basic'];
    if (accessory) accessory.textContent = accInfo.acc || '';

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
      body.style.background = data.color;
      head.textContent = data.emoji || '😡';
      pants.style.background = data.bontanColor || '#1a1a1a';
      // ボス・大型キャラはちょっと大きく
      if (data.isBig) {
        body.style.transform = 'scale(1.3)';
        head.style.fontSize = '60px';
      } else {
        body.style.transform = '';
      }
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

  function init(enemyData, onWin, onLose, stationId) {
    const player = window.Game.getPlayer();
    state = {
      player: {
        hp: player.hp, maxHp: player.maxHp, atk: player.atk,
        guarding: false, busy: false, combo: 0, lastHitAt: 0
      },
      enemy: {
        ...enemyData, maxHp: enemyData.hp, currentHp: enemyData.hp,
        busy: false, guarding: false, archetypeId: enemyData.archetypeId || 'yankee-basic',
        atkBoost: 1
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
    applyCharSprite(playerChar, 'player', { color: '#4a90e2', emoji: '😤', bontanColor: '#3a3a3a' });

    if (enemyData.isRare) {
      log(`<span style="color:#ff3366; font-weight:bold">⚠️ レアエンカウント！本物の極道が現れた！</span>`);
    }
    log(`${enemyData.title}「${enemyData.name}」が現れた！`);
    log(`「${enemyData.voice}」`);
    updateUI();

    // 全ボタンをアクティブに
    document.querySelectorAll('.action-btn').forEach(b => {
      b.disabled = false;
      b.classList.remove('cooling');
    });
    document.getElementById('combo-display').classList.remove('show');

    // Enemy AI loop（少しランダム性）
    scheduleEnemyAction();
  }

  function scheduleEnemyAction() {
    if (!state || state.finished) return;
    const delay = 1200 + Math.random() * 800;
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

  function showCombo(n) {
    const el = document.getElementById('combo-display');
    if (n < 2) { el.classList.remove('show'); return; }
    el.textContent = `${n} HIT COMBO!`;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }

  // プレイヤー攻撃
  const ACTIONS = {
    punch:   { name: 'パンチ', mult: 1.0, hit: 0.9, cd: 320,  text: 'BAM!',    sfx: 'punch',   anim: 'punch',   crit: 0.1 },
    kick:    { name: 'キック', mult: 1.6, hit: 0.7, cd: 580,  text: 'BOOM!',   sfx: 'kick',    anim: 'kick',    crit: 0.15 },
    special: { name: '必殺技', mult: 2.8, hit: 0.6, cd: 1200, text: 'WHAM!!',  sfx: 'special', anim: 'special', crit: 0.25, flash: true },
    guard:   { name: 'ガード', mult: 0,   hit: 1.0, cd: 700,  text: '',        sfx: 'guard',   anim: null,      crit: 0 },
    dash:    { name: '突進',   mult: 2.0, hit: 0.85, cd: 800,  text: 'CHARGE!', sfx: 'dash',    anim: 'dash',    crit: 0.15 },
    throw:   { name: '投げ',   mult: 1.8, hit: 0.75, cd: 1000, text: 'GRAB!!',  sfx: 'throw',   anim: 'throw',   crit: 0.1, breakGuard: true }
  };

  function playerAction(actionKey) {
    if (!state || state.finished || state.player.busy) return;
    const action = ACTIONS[actionKey];
    if (!action) return;

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
      log(`プレイヤーはガード体勢！`);
    } else {
      // 命中判定
      const enemyGuarding = state.enemy.guarding && !action.breakGuard;
      let hitRoll = Math.random();
      if (enemyGuarding) hitRoll += 0.2; // ガード中は当てづらい

      if (hitRoll < action.hit) {
        let baseDmg = state.player.atk * action.mult;
        // クリティカル
        const isCrit = Math.random() < action.crit;
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
        }
        state.player.lastHitAt = now;
        showCombo(state.player.combo);
        window.Audio8 && window.Audio8.SFX.combo(state.player.combo);

        state.enemy.currentHp -= dmg;
        const enemyChar = document.getElementById('enemy-char');
        enemyChar.classList.remove('hit', 'knockback');
        void enemyChar.offsetWidth;
        enemyChar.classList.add(action.mult >= 2.5 ? 'knockback' : 'hit');
        setTimeout(() => enemyChar.classList.remove('hit', 'knockback'), 400);

        setTimeout(() => window.Audio8 && window.Audio8.SFX[isCrit ? 'critical' : 'hit'](), 80);
        if (action.flash || isCrit) flashScreen();
        showHit('#enemy-char', isCrit ? 'CRITICAL!' : action.text);
        showDamageNumber('#enemy-char', dmg, isCrit ? 'critical' : 'normal');

        log(`プレイヤー ${action.name}！ ${dmg}ダメージ${isCrit ? '【会心の一撃！】' : ''}`);
        checkVictory();
      } else {
        window.Audio8 && window.Audio8.SFX.miss();
        showDamageNumber('#enemy-char', 0, 'miss');
        log(`プレイヤーの${action.name}は外れた…`);
        state.player.combo = 0;
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

    // チャージ予告（強い攻撃時）
    if (action.mult >= 2.0) {
      enemyChar.classList.add('charging');
      log(`<span style="color:#ff9966">${state.enemy.name}が力を溜めている…</span>`);
      setTimeout(() => {
        enemyChar.classList.remove('charging');
        executeEnemyAttack(action);
      }, 600);
    } else {
      executeEnemyAttack(action);
    }
  }

  function executeEnemyAttack(action) {
    if (!state || state.finished) return;
    const enemyChar = document.getElementById('enemy-char');
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
      let dmg = Math.floor(state.enemy.atk * action.mult * (0.9 + Math.random() * 0.3));
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
      // コンボリセット
      state.player.combo = 0;
      showCombo(0);

      const playerChar = document.getElementById('player-char');
      playerChar.classList.remove('hit', 'knockback');
      void playerChar.offsetWidth;
      playerChar.classList.add(action.mult >= 2.5 ? 'knockback' : 'hit');
      setTimeout(() => playerChar.classList.remove('hit', 'knockback'), 400);

      setTimeout(() => window.Audio8 && window.Audio8.SFX.hit(), 80);
      if (action.mult >= 2.5) flashScreen();
      showHit('#player-char', action.text);
      showDamageNumber('#player-char', dmg, action.mult >= 2.5 ? 'critical' : 'normal');
      log(`${state.enemy.name}の${action.name}！ ${dmg}ダメージ！`);
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

  return { init, playerAction, stop };
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
