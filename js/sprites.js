// CSS不良スプライト（リーゼント＋改造学ラン）描画モジュール
// battle.js(旧) から切り出し。belt.js と game.js（ボンタン演出）で共有
window.Sprites = (function() {

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
    'karate-boss':   { hair: '#1a1a1a', acc: '🥋', scar: true },
    'skinhead':      { bald: true, tattoo: true, blade: true, skin: '#e8b486', gak: '#26262e', scar: true }
  };

  // リーゼント頭（またはスキンヘッド）のHTML（CSSで描画）
  function delinquentHeadHTML(v) {
    const hair = v.bald
      ? `<div class="dq-dome"></div>${v.tattoo ? '<div class="dq-tattoo">龍</div>' : ''}`
      : `<div class="dq-hair${v.pompXL ? ' xl' : ''}"><div class="dq-pomp"></div></div>`;
    return `
      <div class="dq-face">
        <div class="dq-brow l"></div><div class="dq-brow r"></div>
        ${v.shades ? '<div class="dq-shades"></div>' : '<div class="dq-eye l"></div><div class="dq-eye r"></div>'}
        <div class="dq-mouth"></div>
        ${v.scar ? '<div class="dq-scar"></div>' : ''}
      </div>
      ${hair}`;
  }

  // PNG差し替えの存在キャッシュ（archetypeId → 'ok' | 'none'）
  const SPRITE_CACHE = {};

  // 2フレーム目 (<id>_2.png) があれば交互に切り替えて呼吸アニメにする
  function startIdleFrames(img, path) {
    const path2 = path.replace(/\.png$/i, '_2.png');
    if (SPRITE_CACHE[path2] === 'none') return;
    const probe = new Image();
    probe.onload = () => {
      SPRITE_CACHE[path2] = 'ok';
      let flip = false;
      const timer = setInterval(() => {
        if (!img.isConnected) { clearInterval(timer); return; }
        flip = !flip;
        img.src = flip ? path2 : path;
      }, 550);
    };
    probe.onerror = () => { SPRITE_CACHE[path2] = 'none'; };
    probe.src = path2;
  }

  // charEl（.fighter 構造を持つ要素）に不良スプライトを適用する。
  // assets/characters/<archetypeId>.png があれば画像を優先（Blender製スプライト差し替え用）、
  // 無ければCSS描画。戻り値: 推奨スケール（ボス大型化等。位置側で transform scale に乗せる）
  function applyCharSprite(charEl, archetypeId, data) {
    const body = charEl.querySelector('.char-body');
    const head = charEl.querySelector('.char-head');
    const pants = charEl.querySelector('.char-pants');
    const accessory = charEl.querySelector('.char-accessory');

    const v = VISUALS_BY_ARCHETYPE[archetypeId] || VISUALS_BY_ARCHETYPE['yankee-basic'];

    // アクセサリー絵文字は廃止（頭にサイコロ等が乗って見えるため）
    if (accessory) accessory.textContent = '';

    // CSS描画（画像が無い場合・読み込み完了までのフォールバック）
    charEl.classList.add('dq');
    head.style.display = '';
    body.style.display = '';
    pants.style.display = '';
    charEl.style.setProperty('--hair', data.hairOverride || v.hair || '#15110c');
    charEl.style.setProperty('--gak', data.gakOverride || v.gak || data.color || '#23232b');
    charEl.style.setProperty('--skin', v.skin || '#f0c08a');
    charEl.style.setProperty('--bontan', data.bontanColor || '#1a1a1a');
    head.innerHTML = delinquentHeadHTML(v);
    body.innerHTML = (v.sarashi ? '<div class="dq-sarashi"></div>' : '') +
                     (v.blade ? '<div class="dq-blade"></div>' : ''); // 青龍刀
    body.classList.toggle('white-gak', !!v.white);

    // PNG差し替え（候補を順に試す：駅専用ボス画像 → アーキタイプ画像 → CSS描画のまま）
    const oldImg = charEl.querySelector('img.char-sprite');
    if (oldImg) oldImg.remove();
    const candidates = (data.spritePaths || [`assets/characters/${archetypeId}.png`])
      .filter(p => SPRITE_CACHE[p] !== 'none');
    (function tryLoad(i) {
      if (i >= candidates.length) return;
      const path = candidates[i];
      const img = new Image();
      img.onload = () => {
        SPRITE_CACHE[path] = 'ok';
        if (!charEl.isConnected) return;
        img.className = 'char-sprite';
        if (data.spriteHue) img.style.filter = `hue-rotate(${data.spriteHue}deg)`; // 雑魚の色違い用
        charEl.appendChild(img);
        head.style.display = 'none';
        body.style.display = 'none';
        pants.style.display = 'none';
        startIdleFrames(img, path);
      };
      img.onerror = () => {
        SPRITE_CACHE[path] = 'none';
        tryLoad(i + 1);
      };
      img.src = path;
    })(0);

    return v.scale || (data.isBig ? 1.22 : 1);
  }

  return { applyCharSprite, delinquentHeadHTML, VISUALS_BY_ARCHETYPE };
})();
