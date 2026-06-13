// 強化ショップ＋見た目カスタム（カツアゲ金で恒久強化／着せ替えを買う＝メタ進行）
// オーバーレイをJSで生成。index.html の構造には依存しない。
// 分担: 1号機=shop/save/通貨/UI配線、4号機=applyCharSprite による char 描画。
window.ShopUI = (function() {

  // 強化定義: lvごとにコスト上昇。apply は購入時にプレイヤーへ反映
  const UPGRADES = [
    {
      key: 'hp', icon: '💪', name: 'ど根性',
      desc: '最大HP +25',
      cost: lv => 80 + lv * 60, max: 20,
      apply: p => { p.maxHp += 25; p.hp = p.maxHp; }
    },
    {
      key: 'atk', icon: '👊', name: '喧嘩殺法',
      desc: 'ATK +4',
      cost: lv => 100 + lv * 80, max: 20,
      apply: p => { p.atk += 4; }
    },
    {
      key: 'meter', icon: '🔥', name: '気合い注入',
      desc: '戦闘開始時の必殺ゲージ +25%',
      cost: lv => 150 + lv * 120, max: 3,
      apply: () => {}   // 効果は belt.js init が upgrades.meter を読んで反映
    },
    // ▼ 戦闘強化ツリー（効果は belt.js の playerHitCheck が upgrades を読んで反映）
    {
      key: 'combo', icon: '🥊', name: '連撃の極み',
      desc: 'コンボの威力上昇が大きくなる',
      cost: lv => 120 + lv * 100, max: 5, apply: () => {}
    },
    {
      key: 'crit', icon: '💢', name: '一撃必殺',
      desc: 'クリティカル率 +5%',
      cost: lv => 140 + lv * 110, max: 6, apply: () => {}
    },
    {
      key: 'power', icon: '☄️', name: '特攻魂',
      desc: '必殺技の威力 +15%',
      cost: lv => 160 + lv * 130, max: 5, apply: () => {}
    }
  ];

  // 見た目カスタム。slotごとに選択肢(id/名前/価格)。id は 4号機 applyCharSprite の cosmetics キーに対応。
  // ※ horimono/leather/irezumi 等の追加分は 4号機のキー確定後にここへ足す（カタログ追加だけで反映）。
  const COSMETICS = {
    hair:   { label: '髪型', items: [
      { id: 'plain',       name: '七三・短髪',          cost: 0 },
      { id: 'pomp',        name: 'リーゼント',          cost: 120 },
      { id: 'pompXL',      name: '超ロングリーゼント',  cost: 320 },
      { id: 'mohawk',      name: 'モヒカン',            cost: 200 },
      { id: 'skinhead',    name: 'スキンヘッド',        cost: 160 }
    ] },
    outfit: { label: '服装', items: [
      { id: 'gakuran',     name: '学ラン',              cost: 0 },
      { id: 'tokkofuku',   name: '特攻服',              cost: 260 },
      { id: 'white-tokko', name: '白特攻服',            cost: 420 }
    ] },
    face:   { label: '顔',   items: [
      { id: 'plain',       name: '素顔',                cost: 0 },
      { id: 'shades',      name: 'サングラス',          cost: 120 },
      { id: 'mask',        name: 'マスク',              cost: 90 }
    ] }
  };
  // 初期から無料で所持している id（真面目少年の初期装備）
  const FREE = { hair: 'plain', outfit: 'gakuran', face: 'plain' };

  let overlay = null;
  let tab = 'upgrade';

  function lv(p, key) { return (p.upgrades && p.upgrades[key]) || 0; }
  function ownsLook(p, slot, id) {
    return FREE[slot] === id ||
      (p.cosmeticsOwned && p.cosmeticsOwned[slot] && p.cosmeticsOwned[slot].indexOf(id) >= 0);
  }

  function open() {
    const p = window.Game.getPlayer();
    if (!p.upgrades) p.upgrades = {};
    if (typeof p.money !== 'number') p.money = 0;
    if (!p.cosmetics) p.cosmetics = { hair: 'plain', outfit: 'gakuran', face: 'plain' };
    if (!p.cosmeticsOwned) p.cosmeticsOwned = { hair: ['plain'], outfit: ['gakuran'], face: ['plain'] };
    window.Audio8 && window.Audio8.SFX.menu && window.Audio8.SFX.menu();
    render(p);
  }

  function close() {
    if (overlay) { overlay.remove(); overlay = null; }
  }

  function render(p) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'shop-overlay';
      document.body.appendChild(overlay);
    }
    const body = (tab === 'look') ? lookHTML(p) : upgradeHTML(p);
    overlay.innerHTML = `
      <div class="shop-panel">
        <div class="shop-head">
          <h2>🛒 ショップ</h2>
          <div class="shop-money">所持金 <b>${p.money}</b>円</div>
        </div>
        <div class="shop-tabs">
          <button class="shop-tab${tab === 'upgrade' ? ' on' : ''}" data-tab="upgrade">強化</button>
          <button class="shop-tab${tab === 'look' ? ' on' : ''}" data-tab="look">見た目</button>
        </div>
        ${body}
        <button class="shop-close big-btn">閉じる</button>
      </div>`;

    overlay.querySelector('.shop-close').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelectorAll('.shop-tab').forEach(b =>
      b.addEventListener('click', () => { tab = b.dataset.tab; render(p); }));

    if (tab === 'look') bindLook(p); else bindUpgrade(p);
  }

  // ===== 強化タブ =====
  function upgradeHTML(p) {
    const rows = UPGRADES.map(u => {
      const l = lv(p, u.key);
      const maxed = l >= u.max;
      const cost = u.cost(l);
      const afford = p.money >= cost && !maxed;
      const btn = maxed
        ? '<span class="shop-maxed">MAX</span>'
        : `<button class="shop-buy${afford ? '' : ' disabled'}" data-key="${u.key}"${afford ? '' : ' disabled'}>${cost}円</button>`;
      return `
        <div class="shop-row">
          <span class="shop-ic">${u.icon}</span>
          <div class="shop-mid">
            <div class="shop-name">${u.name} <span class="shop-lv">Lv.${l}${maxed ? '' : '/' + u.max}</span></div>
            <div class="shop-desc">${u.desc}</div>
          </div>
          ${btn}
        </div>`;
    }).join('');
    return `<div class="shop-list">${rows}</div>`;
  }

  function bindUpgrade(p) {
    overlay.querySelectorAll('.shop-buy').forEach(b => {
      if (b.disabled) return;
      b.addEventListener('click', () => buy(p, b.dataset.key));
    });
  }

  function buy(p, key) {
    const u = UPGRADES.find(x => x.key === key);
    if (!u) return;
    const l = lv(p, key);
    if (l >= u.max) return;
    const cost = u.cost(l);
    if (p.money < cost) { window.Audio8 && window.Audio8.SFX.miss && window.Audio8.SFX.miss(); return; }
    p.money -= cost;
    p.upgrades[key] = l + 1;
    u.apply(p);
    window.Achievements && window.Achievements.grant(p, 'shopper');   // 実績「常連」
    window.Audio8 && window.Audio8.SFX.levelup && window.Audio8.SFX.levelup();
    window.Game.persist && window.Game.persist();
    if (window.MapUI) window.MapUI.render();   // マップのHP/ATK/金表示を更新
    render(p);                                  // ショップ再描画
  }

  // ===== 見た目タブ =====
  function lookHTML(p) {
    const cats = Object.keys(COSMETICS).map(slot => {
      const cat = COSMETICS[slot];
      const items = cat.items.map(it => {
        const own = ownsLook(p, slot, it.id);
        const on = p.cosmetics[slot] === it.id;
        const label = own ? (on ? '装備中' : '装備') : `${it.cost}円`;
        const disabled = !own && p.money < it.cost;
        const cls = 'look-item' + (on ? ' on' : '') + (own ? ' owned' : '') + (disabled ? ' disabled' : '');
        return `<button class="${cls}" data-slot="${slot}" data-id="${it.id}">
            <span class="look-name">${it.name}</span><span class="look-tag">${label}</span>
          </button>`;
      }).join('');
      return `<div class="look-cat">
          <div class="look-cat-label">${cat.label}</div>
          <div class="look-grid">${items}</div>
        </div>`;
    }).join('');
    return `<div class="look-wrap">
        <div class="look-preview" id="look-preview"></div>
        <div class="look-cats">${cats}</div>
      </div>`;
  }

  function bindLook(p) {
    renderPreview(p);
    overlay.querySelectorAll('.look-item').forEach(b =>
      b.addEventListener('click', () => chooseLook(p, b.dataset.slot, b.dataset.id)));
  }

  // 主人公のライブプレビュー（applyCharSprite に cosmetics を渡して描画）
  function renderPreview(p) {
    const host = overlay.querySelector('#look-preview');
    if (!host) return;
    host.innerHTML = `<div class="fighter belt-f">
        <div class="char-aura"></div><div class="char-accessory"></div>
        <div class="char-head"></div><div class="char-body"></div>
        <div class="char-pants"></div><div class="char-shadow"></div>
        <div class="dq-fist"></div><div class="dq-foot"></div>
      </div>`;
    const fEl = host.querySelector('.fighter');
    if (window.Sprites && window.Sprites.applyCharSprite) {
      try {
        window.Sprites.applyCharSprite(fEl, 'player', {
          cosmetics: p.cosmetics, color: '#191921', bontanColor: '#23232c'
        });
      } catch (e) { /* 描画側未対応キーは無視 */ }
    }
  }

  function chooseLook(p, slot, id) {
    const it = COSMETICS[slot].items.find(x => x.id === id);
    if (!it) return;
    if (!ownsLook(p, slot, id)) {
      // 未所持 → 購入
      if (p.money < it.cost) { window.Audio8 && window.Audio8.SFX.miss && window.Audio8.SFX.miss(); return; }
      p.money -= it.cost;
      if (!p.cosmeticsOwned[slot]) p.cosmeticsOwned[slot] = [];
      p.cosmeticsOwned[slot].push(id);
      window.Achievements && window.Achievements.grant(p, 'shopper');
      window.Audio8 && window.Audio8.SFX.levelup && window.Audio8.SFX.levelup();
    } else {
      window.Audio8 && window.Audio8.SFX.menu && window.Audio8.SFX.menu();
    }
    p.cosmetics[slot] = id;   // 装備
    window.Game.persist && window.Game.persist();
    if (window.MapUI) window.MapUI.render();
    render(p);
  }

  return { open, close };
})();
