// 強化ショップ（カツアゲ金で恒久強化を買う＝メタ進行）
// オーバーレイをJSで生成。index.html の構造には依存しない。
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

  let overlay = null;

  function lv(p, key) { return (p.upgrades && p.upgrades[key]) || 0; }

  function open() {
    const p = window.Game.getPlayer();
    if (!p.upgrades) p.upgrades = {};
    if (typeof p.money !== 'number') p.money = 0;
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

    overlay.innerHTML = `
      <div class="shop-panel">
        <div class="shop-head">
          <h2>🛒 強化ショップ</h2>
          <div class="shop-money">所持金 <b>${p.money}</b>円</div>
        </div>
        <div class="shop-list">${rows}</div>
        <button class="shop-close big-btn">閉じる</button>
      </div>`;

    overlay.querySelector('.shop-close').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
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

  return { open, close };
})();
