// エンディング（大沢仁志撃破→三谷水産の番長就任→やくざ決意）
// トーン: くにおくん風コメディ・不敵（重い説教くさくしない）。intro と同じ会話形式。
// ※発火トリガー(最終章=大沢仁志撃破)は未接続。window.Game.playEnding() で起動できる枠。
window.StoryEnding = (function() {

  // {playerName} は render 時に主人公名へ差し込み
  const BASE_PANELS = [
    { who: '', face: '👑', cls: 'narr',
      text: '――三河三谷・三谷水産。{playerName}は、ついに大沢仁志を倒した。' },
    { who: '三谷水産 新番長', face: '😎', cls: 'hero',
      text: '名鉄全線、端から端まで全部シメてやったぜ。三谷水産の番長は、今日から俺だ。' },
    { who: '', face: '🌊', cls: 'narr',
      text: 'だが番長になった{playerName}は、生まれ育った港町へ戻り――' },
    { who: '{playerName}', face: '😎', cls: 'hero',
      text: '親父。俺、漁師は継がねえ。' },
    { who: '親父', face: '😠', cls: 'boss',
      text: 'なんだと……？' },
    { who: '{playerName}', face: '😎', cls: 'hero',
      text: '<b style="color:#ff9a3c">漁師なんて金にならねぇ。刺激ほしいからやくざになるわ。</b>' },
    { who: '{playerName}', face: '🚬', cls: 'hero',
      text: '達者でな、親父。……名鉄の主役は、これからだ。' },
    { who: '', face: '🚃💨', cls: 'narr',
      text: '真面目な少年は、番長になり、そしてやくざの道へ――。　～完～' }
  ];

  let panels = [], idx = 0, done = null, bound = false;

  function play(onDone) {
    done = onDone; idx = 0;
    const p = (window.Game && window.Game.getPlayer && window.Game.getPlayer()) || {};
    // 総括パネルを動的生成して末尾に追加
    const bontans = (p.bontans && p.bontans.length) || 0;
    const best = p.bestStreak || 0;
    const fame = p.fame || 0;
    const title = (window.Fame && window.Fame.title) ? window.Fame.title(fame) : '';
    panels = BASE_PANELS.concat([
      { who: '', face: '🏆', cls: 'narr',
        text: `【{playerName}の記録】<br>総ボンタン <b>${bontans}</b>本　最大連勝 <b>${best}</b>　名声 <b>${fame}</b>（${title}）` }
    ]);
    window.Game.showScreen('screen-ending');
    if (!bound) {
      bound = true;
      const nx = document.getElementById('btn-ending-next');
      const sk = document.getElementById('btn-ending-skip');
      if (nx) nx.addEventListener('click', next);
      if (sk) sk.addEventListener('click', finish);
    }
    render();
    window.Audio8 && window.Audio8.startBgm && window.Audio8.startBgm('boss');
  }

  function fill(s) {
    const name = ((window.Game && window.Game.getPlayer && window.Game.getPlayer().name) || 'ボンタン狩り太郎');
    return String(s).replace(/\{playerName\}/g, name);
  }

  function render() {
    const p = panels[idx];
    const box = document.getElementById('ending-box');
    if (box) box.className = 'intro-box ' + p.cls;
    setText('ending-face', p.face, true);
    setText('ending-who', fill(p.who), false);
    setText('ending-text', fill(p.text), true);
    const nx = document.getElementById('btn-ending-next');
    if (nx) nx.textContent = (idx >= panels.length - 1) ? 'タイトルへ ▶' : '次へ ▶';
    window.Audio8 && window.Audio8.SFX.menu && window.Audio8.SFX.menu();
  }

  function setText(id, html, asHtml) {
    const el = document.getElementById(id);
    if (!el) return;
    if (asHtml) el.innerHTML = html; else el.textContent = html;
  }

  function next() {
    idx++;
    if (idx >= panels.length) finish();
    else render();
  }

  function finish() {
    if (done) { const d = done; done = null; d(); }
  }

  return { play };
})();
