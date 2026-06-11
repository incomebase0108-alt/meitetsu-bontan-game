// 路線図UI
window.MapUI = (function() {

  function render() {
    const mapEl = document.getElementById('route-map');
    const player = window.Game.getPlayer();
    const currentIdx = window.Game.getCurrentStationIndex();

    let html = '';
    let prevLine = null;
    window.STATIONS.forEach((st, idx) => {
      if (prevLine && prevLine !== st.line) {
        html += `<div class="line-divider">━━ ${st.line} ━━</div>`;
      } else if (!prevLine) {
        html += `<div class="line-divider">━━ ${st.line} ━━</div>`;
      }
      prevLine = st.line;

      const defeated = player.defeated.includes(st.id);
      const current = idx === currentIdx;
      const locked = idx > currentIdx;
      const classes = ['station-row'];
      if (current) classes.push('current');
      else if (defeated) classes.push('defeated');
      if (locked) classes.push('locked');

      let marker = '🚉';
      if (defeated) marker = '✅';
      else if (current) marker = '👉';
      else if (st.isFinalBoss) marker = '👑';
      else if (st.isMidBoss) marker = '⚔️';

      // 治安バッジ：danger 1=少し悪い、2=かなり悪い
      let danger = '';
      if (st.danger === 1) danger = ' <span class="danger-badge low">⚠ 治安悪し</span>';
      else if (st.danger >= 2) danger = ' <span class="danger-badge high">💀 治安最悪</span>';
      // ガチャ駅（レアエンカウント）バッジ
      let gamble = '';
      if (st.rareEnemy) {
        const pct = Math.round((st.rareChance || 0) * 100);
        gamble = ` <span class="danger-badge gamble">🎰 ${st.gambleNote || 'レア出現'} (${pct}%)</span>`;
      }

      // レアエンカウント情報
      let rareInfo = '';
      if (st.rareEnemy) {
        rareInfo = `<div class="rare-enemy">└ ${st.rareEnemy.emoji} <strong>${st.rareEnemy.name}</strong> HP:${st.rareEnemy.hp} / ATK:${st.rareEnemy.atk} <span class="rare-chance">出現${Math.round((st.rareChance||0)*100)}%</span></div>`;
      }

      html += `
        <div class="${classes.join(' ')}" data-idx="${idx}">
          <span class="station-marker">${marker}</span>
          <div class="station-info">
            <div><strong>${st.name}</strong> (${st.kana})${danger}${gamble}</div>
            <div class="station-enemy">${st.enemy.emoji} ${st.enemy.title}「${st.enemy.name}」 HP:${st.enemy.hp} / ATK:${st.enemy.atk}</div>
            ${rareInfo}
          </div>
        </div>
      `;
    });

    mapEl.innerHTML = html;

    // HPとボンタン数の更新
    document.getElementById('map-hp').textContent = player.hp;
    const maxHpEl = document.getElementById('map-maxhp');
    if (maxHpEl) maxHpEl.textContent = player.maxHp;
    const atkEl = document.getElementById('map-atk');
    if (atkEl) atkEl.textContent = player.atk;
    document.getElementById('map-bontans').textContent = player.bontans.length;

    // 現在駅にスクロール
    const currentRow = mapEl.querySelector('.station-row.current');
    if (currentRow) currentRow.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  return { render };
})();
