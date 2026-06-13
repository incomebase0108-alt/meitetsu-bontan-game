// ボンタン図鑑（コレクション）＋収集マイルストーン報酬
// 全駅ボスのボンタンを集める。収集率と未収集はシルエット表示でコンプ欲を煽る。
window.BontanDex = (function() {

  // 収集マイルストーン報酬（一度きり・カツアゲ金）
  const MILES = [
    { n: 5,  money: 300 },
    { n: 10, money: 700 },
    { n: 15, money: 1200 },
    { n: 23, money: 3000 }
  ];

  let overlay = null;

  function gotCount(p) {
    return (window.STATIONS || []).filter(s => p.defeated.includes(s.id)).length;
  }

  function open() {
    const p = window.Game.getPlayer();
    if (!p.dexClaims) p.dexClaims = {};
    window.Audio8 && window.Audio8.SFX.menu && window.Audio8.SFX.menu();
    render(p);
  }

  function close() {
    if (overlay) { overlay.remove(); overlay = null; }
  }

  function render(p) {
    const stations = window.STATIONS || [];
    const got = gotCount(p);
    const total = stations.length;

    const cells = stations.map(s => {
      const have = p.defeated.includes(s.id);
      const col = (s.enemy && s.enemy.bontanColor) || '#888';
      const nm = have ? ((s.enemy && s.enemy.name) || s.name) : '？？？';
      return `<div class="dex-cell ${have ? 'got' : 'locked'}">
        <div class="dex-bontan" style="background:${have ? col : '#1c1c22'}"></div>
        <div class="dex-name">${nm}</div>
      </div>`;
    }).join('');

    const miles = MILES.map(m => {
      const reached = got >= m.n;
      const claimed = !!p.dexClaims[m.n];
      const btn = claimed
        ? '<span class="dex-claimed">受取済</span>'
        : reached
          ? `<button class="dex-claim" data-n="${m.n}">💴${m.money}円 受取</button>`
          : `<span class="dex-lock">あと${m.n - got}体</span>`;
      return `<div class="dex-mile"><span>${m.n}体 収集報酬</span>${btn}</div>`;
    }).join('');

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'shop-overlay';
      document.body.appendChild(overlay);
    }
    const pct = total ? Math.round(got / total * 100) : 0;
    overlay.innerHTML = `
      <div class="shop-panel dex-panel">
        <div class="shop-head">
          <h2>📖 ボンタン図鑑</h2>
          <div class="shop-money">${got}/${total} <b>${pct}%</b></div>
        </div>
        <div class="dex-bar"><i style="width:${pct}%"></i></div>
        <div class="dex-grid">${cells}</div>
        <div class="dex-miles">${miles}</div>
        <button class="shop-close big-btn">閉じる</button>
      </div>`;

    overlay.querySelector('.shop-close').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelectorAll('.dex-claim').forEach(b =>
      b.addEventListener('click', () => claim(p, parseInt(b.dataset.n, 10))));
  }

  function claim(p, n) {
    const m = MILES.find(x => x.n === n);
    if (!m || p.dexClaims[n] || gotCount(p) < n) return;
    p.dexClaims[n] = true;
    p.money = (p.money || 0) + m.money;
    window.Audio8 && window.Audio8.SFX.levelup && window.Audio8.SFX.levelup();
    window.Game.persist && window.Game.persist();
    if (window.MapUI) window.MapUI.render();
    render(p);
  }

  return { open, close };
})();
