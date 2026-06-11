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

  // charEl（.fighter 構造を持つ要素）に不良スプライトを適用する。
  // 戻り値: 推奨スケール（ボス大型化等。位置側で transform scale に乗せる）
  function applyCharSprite(charEl, archetypeId, data) {
    const body = charEl.querySelector('.char-body');
    const head = charEl.querySelector('.char-head');
    const pants = charEl.querySelector('.char-pants');
    const accessory = charEl.querySelector('.char-accessory');

    const v = VISUALS_BY_ARCHETYPE[archetypeId] || VISUALS_BY_ARCHETYPE['yankee-basic'];

    // アクセサリー絵文字は廃止（頭にサイコロ等が乗って見えるため）
    if (accessory) accessory.textContent = '';

    charEl.classList.add('dq');
    charEl.style.setProperty('--hair', data.hairOverride || v.hair || '#15110c');
    charEl.style.setProperty('--gak', data.gakOverride || v.gak || data.color || '#23232b');
    charEl.style.setProperty('--skin', v.skin || '#f0c08a');
    charEl.style.setProperty('--bontan', data.bontanColor || '#1a1a1a');
    head.innerHTML = delinquentHeadHTML(v);
    body.innerHTML = v.sarashi ? '<div class="dq-sarashi"></div>' : '';
    body.classList.toggle('white-gak', !!v.white);

    return v.scale || (data.isBig ? 1.22 : 1);
  }

  return { applyCharSprite, delinquentHeadHTML, VISUALS_BY_ARCHETYPE };
})();
