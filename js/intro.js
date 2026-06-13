// オープニング・ストーリー（三谷水産の鉄砲玉が名鉄全線をシメに行く）
window.StoryIntro = (function() {

  const PANELS = [
    { who: '三谷水産 番長', face: '🦑', cls: 'boss',
      text: 'おう、新入り。三谷水産にゃ威勢のいいのが揃っとるが……テメェみてぇな弱(よえ)ぇ鉄砲玉が、一番下っ端よ。' },
    { who: '三谷水産 番長', face: '🦑', cls: 'boss',
      text: '蒲郡線から西尾線……<b style="color:#ff9a3c">名鉄全線、端から端までシメてこいや。</b>' },
    { who: '三谷水産 番長', face: '🦑', cls: 'boss',
      text: '各駅の番長どものボンタン、全部引っ剥がして持って帰れ。手ぶらで戻ったら……三河湾に沈めるぞ。' },
    { who: 'お前（鉄砲玉）', face: '😨', cls: 'hero',
      text: 'お、押忍ッ……！三谷水産の名にかけて……い、いってきますッ！' },
    { who: '', face: '🚃💨', cls: 'narr',
      text: '――蒲郡駅前。弱小鉄砲玉の、たった一人のボンタン狩りが始まる。' }
  ];

  let idx = 0, done = null, bound = false;

  function play(onDone) {
    done = onDone; idx = 0;
    window.Game.showScreen('screen-intro');
    if (!bound) {
      bound = true;
      const nx = document.getElementById('btn-intro-next');
      const sk = document.getElementById('btn-intro-skip');
      if (nx) nx.addEventListener('click', next);
      if (sk) sk.addEventListener('click', finish);
    }
    render();
    window.Audio8 && window.Audio8.startBgm && window.Audio8.startBgm('boss');
  }

  function render() {
    const p = PANELS[idx];
    const box = document.getElementById('intro-box');
    if (box) box.className = 'intro-box ' + p.cls;
    setText('intro-face', p.face, true);
    setText('intro-who', p.who, false);
    setText('intro-text', p.text, true);
    const nx = document.getElementById('btn-intro-next');
    if (nx) nx.textContent = (idx >= PANELS.length - 1) ? '出発！ ▶' : '次へ ▶';
    window.Audio8 && window.Audio8.SFX.menu && window.Audio8.SFX.menu();
  }

  function setText(id, html, asHtml) {
    const el = document.getElementById(id);
    if (!el) return;
    if (asHtml) el.innerHTML = html; else el.textContent = html;
  }

  function next() {
    idx++;
    if (idx >= PANELS.length) finish();
    else render();
  }

  function finish() {
    if (done) { const d = done; done = null; d(); }
  }

  return { play };
})();
