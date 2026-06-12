// ボス編集機能：各駅ボスの名前・二つ名・登場セリフをゲーム内で編集
// localStorage に差分のみ保存。空欄や初期値と同じ場合は保存しない（＝元に戻る）
window.BossEdit = (function() {
  const KEY = 'meitetsu-bontan-custom-v1';
  let defaults = null; // 初期値スナップショット

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function loadCustom() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }

  function saveCustom(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }

  function snapshot() {
    if (defaults) return;
    defaults = {};
    window.STATIONS.forEach(st => {
      defaults[st.id] = { name: st.enemy.name, title: st.enemy.title, voice: st.enemy.voice };
    });
  }

  // カスタム値を STATIONS に反映（戦闘・マップ・ボンタン演出すべてここ経由の値を使う）
  function apply() {
    snapshot();
    const c = loadCustom();
    window.STATIONS.forEach(st => {
      const d = defaults[st.id];
      const o = c[st.id] || {};
      st.enemy.name = o.name || d.name;
      st.enemy.title = o.title || d.title;
      st.enemy.voice = o.voice || d.voice;
    });
  }

  function render() {
    snapshot();
    const list = document.getElementById('edit-list');
    list.innerHTML = window.STATIONS.map(st => {
      const mark = st.isFinalBoss ? '👑' : (st.isMidBoss ? '⚔️' : '');
      return `<div class="edit-row" data-id="${st.id}">
        <div class="edit-station">${esc(st.name)}駅 ${mark}</div>
        <label>名前 <input class="ed-name" maxlength="16" value="${esc(st.enemy.name)}" placeholder="${esc(defaults[st.id].name)}"></label>
        <label>二つ名 <input class="ed-title" maxlength="26" value="${esc(st.enemy.title)}" placeholder="${esc(defaults[st.id].title)}"></label>
        <label>セリフ <input class="ed-voice" maxlength="44" value="${esc(st.enemy.voice)}" placeholder="${esc(defaults[st.id].voice)}"></label>
      </div>`;
    }).join('');
  }

  function saveFromUI() {
    const c = {};
    document.querySelectorAll('#edit-list .edit-row').forEach(row => {
      const id = row.dataset.id;
      const d = defaults[id];
      if (!d) return;
      const name = row.querySelector('.ed-name').value.trim();
      const title = row.querySelector('.ed-title').value.trim();
      const voice = row.querySelector('.ed-voice').value.trim();
      const o = {};
      if (name && name !== d.name) o.name = name;
      if (title && title !== d.title) o.title = title;
      if (voice && voice !== d.voice) o.voice = voice;
      if (Object.keys(o).length) c[id] = o;
    });
    saveCustom(c);
    apply();
  }

  function resetAll() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    apply();
    render();
  }

  window.addEventListener('DOMContentLoaded', () => {
    apply(); // 起動時にカスタムを反映

    const btnOpen = document.getElementById('btn-edit');
    const btnSave = document.getElementById('btn-edit-save');
    const btnReset = document.getElementById('btn-edit-reset');
    const btnBack = document.getElementById('btn-edit-back');
    const msg = document.getElementById('edit-msg');
    if (!btnOpen) return;

    btnOpen.addEventListener('click', () => {
      render();
      if (msg) msg.textContent = '';
      window.Game.showScreen('screen-edit');
    });
    btnSave.addEventListener('click', () => {
      saveFromUI();
      if (msg) msg.textContent = '✅ 保存しました！次の戦闘から反映されます';
      window.Audio8 && window.Audio8.SFX.levelup && window.Audio8.SFX.levelup();
    });
    btnReset.addEventListener('click', () => {
      resetAll();
      if (msg) msg.textContent = '全駅を初期設定に戻しました';
      window.Audio8 && window.Audio8.SFX.menu && window.Audio8.SFX.menu();
    });
    btnBack.addEventListener('click', () => {
      window.Game.showScreen('screen-title');
    });
  });

  return { apply, render };
})();
