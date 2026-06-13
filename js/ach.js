// 実績（アチーブメント）＝目標の階段。解除でカツアゲ金＋トースト通知。
window.Achievements = (function() {

  const LIST = [
    { id: 'first_blood', name: '初陣',           desc: '最初の駅を制覇',        money: 100 },
    { id: 'combo50',     name: 'コンボ番長',     desc: '1戦で50コンボ達成',     money: 200 },
    { id: 'nohit',       name: '無傷の伝説',     desc: 'ノーダメでボス撃破',    money: 300 },
    { id: 'rainbow',     name: '虹を掴んだ男',   desc: '虹レアを引く',          money: 500 },
    { id: 'half',        name: '西尾線の主',     desc: '12駅を制覇',            money: 400 },
    { id: 'allclear',    name: '全駅制覇',       desc: '全23駅を制覇',          money: 1000 },
    { id: 'rich',        name: '札束ヤンキー',   desc: '所持金1000円に到達',    money: 200 },
    { id: 'shopper',     name: '常連',           desc: '強化ショップで初購入',  money: 100 }
  ];

  function earned(p, id) { return !!(p.achievements && p.achievements[id]); }

  function grant(p, id) {
    if (!p.achievements) p.achievements = {};
    if (p.achievements[id]) return;
    const a = LIST.find(x => x.id === id);
    if (!a) return;
    p.achievements[id] = true;
    p.money = (p.money || 0) + a.money;
    toast(a);
    window.Game && window.Game.persist && window.Game.persist();
    if (window.MapUI) window.MapUI.render();
  }

  function checkOnWin(p, res, tier) {
    const got = (window.STATIONS || []).filter(s => p.defeated.includes(s.id)).length;
    if (got >= 1) grant(p, 'first_blood');
    if (res && res.maxCombo >= 50) grant(p, 'combo50');
    if (res && res.noHit) grant(p, 'nohit');
    if (tier && tier.color === 'rainbow') grant(p, 'rainbow');
    if (got >= 12) grant(p, 'half');
    if (got >= 23) grant(p, 'allclear');
    if ((p.money || 0) >= 1000) grant(p, 'rich');
  }

  let toastN = 0;
  function toast(a) {
    const t = document.createElement('div');
    t.className = 'ach-toast';
    t.style.bottom = (16 + toastN * 64) + 'px';
    toastN++;
    t.innerHTML = `🏅 実績解除「${a.name}」<br><small>${a.desc}　💴+${a.money}円</small>`;
    document.body.appendChild(t);
    window.Audio8 && window.Audio8.SFX.levelup && window.Audio8.SFX.levelup();
    setTimeout(() => t.classList.add('show'), 20);
    setTimeout(() => { t.classList.remove('show'); toastN = Math.max(0, toastN - 1); setTimeout(() => t.remove(), 400); }, 2800);
  }

  function open() {
    const p = window.Game.getPlayer();
    if (!p.achievements) p.achievements = {};
    const rows = LIST.map(a => {
      const e = earned(p, a.id);
      return `<div class="ach-row ${e ? 'got' : ''}">
        <span class="ach-ic">${e ? '🏅' : '🔒'}</span>
        <div class="ach-mid"><div class="ach-name">${e ? a.name : '？？？'}</div><div class="ach-desc">${a.desc}</div></div>
        <span class="ach-rw">+${a.money}円</span>
      </div>`;
    }).join('');
    const got = LIST.filter(a => earned(p, a.id)).length;
    const ov = document.createElement('div');
    ov.className = 'shop-overlay';
    ov.innerHTML = `<div class="shop-panel">
      <div class="shop-head"><h2>🏅 実績</h2><div class="shop-money">${got}/${LIST.length}</div></div>
      <div class="ach-list">${rows}</div>
      <button class="shop-close big-btn">閉じる</button>
    </div>`;
    document.body.appendChild(ov);
    ov.querySelector('.shop-close').addEventListener('click', () => ov.remove());
    ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
    window.Audio8 && window.Audio8.SFX.menu && window.Audio8.SFX.menu();
  }

  return { checkOnWin, grant, open };
})();
