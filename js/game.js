// ゲーム状態管理 / 画面遷移
window.Game = (function() {
  let player = null;
  let currentStationIndex = 0;

  // 初期化（タイトル画面表示、セーブの有無で「続きから」を出す）
  function init() {
    player = JSON.parse(JSON.stringify(window.PLAYER_INIT));
    currentStationIndex = 0;
    showScreen('screen-title');
    // セーブデータ存在チェック
    const cont = document.getElementById('btn-continue');
    if (window.Save && window.Save.hasSave()) {
      cont.style.display = '';
    } else {
      cont.style.display = 'none';
    }
    window.Audio8 && window.Audio8.startBgm('title');
  }

  function newGame() {
    player = JSON.parse(JSON.stringify(window.PLAYER_INIT));
    currentStationIndex = 0;
    window.Save && window.Save.clear();
    startGame();
  }

  function continueGame() {
    const data = window.Save && window.Save.load();
    if (!data) { newGame(); return; }
    player = data.player;
    currentStationIndex = data.currentStationIndex || 0;
    showScreen('screen-map');
    window.MapUI.render();
    window.Audio8 && window.Audio8.startBgm('map');
  }

  function startGame() {
    player.hp = player.maxHp;
    showScreen('screen-map');
    window.MapUI.render();
    persist();
    window.Audio8 && window.Audio8.startBgm('map');
  }

  function persist() {
    if (window.Save) window.Save.save(player, currentStationIndex);
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  // 「電車を降りる」 → 電車アニメ → 戦闘
  function boardStation() {
    const st = window.STATIONS[currentStationIndex];
    if (!st) return;
    if (player.defeated.includes(st.id)) {
      // 既にクリア済みは飛ばして次へ
      nextStation();
      return;
    }
    // 最初の駅（蒲郡）は電車アニメをスキップ
    if (currentStationIndex === 0) {
      startBattle();
      return;
    }
    playTrainCutscene(window.STATIONS[currentStationIndex - 1], st, startBattle);
  }

  function playTrainCutscene(from, to, onDone) {
    showScreen('screen-train');
    document.getElementById('train-from-name').textContent = from.name;
    document.getElementById('train-to-name').textContent = to.name;
    document.getElementById('train-distance').textContent = to.distanceFromPrev.toFixed(1);
    window.Audio8 && window.Audio8.SFX.train();
    // 電車アニメ用のクラス追加（CSSキーフレームで動かす）
    const sprite = document.getElementById('train-sprite');
    sprite.classList.remove('moving');
    void sprite.offsetWidth;
    sprite.classList.add('moving');
    setTimeout(() => {
      onDone();
    }, 2800);
  }

  function startBattle() {
    const st = window.STATIONS[currentStationIndex];
    showScreen('screen-battle');
    // レアエンカウント判定（賭博駅など）
    let enemy = st.enemy;
    let bgmMode = 'battle';
    if (st.rareEnemy && Math.random() < (st.rareChance || 0)) {
      enemy = st.rareEnemy;
      bgmMode = 'boss';
      window.Audio8 && window.Audio8.SFX.final();
    } else if (st.isFinalBoss) {
      bgmMode = 'boss';
      window.Audio8 && window.Audio8.SFX.final();
    } else if (st.isMidBoss) {
      bgmMode = 'boss';
    }
    window.Audio8 && window.Audio8.startBgm(bgmMode);
    window.Battle.init(enemy, onBattleWin, onBattleLose, st.id);
  }

  function onBattleWin(enemy) {
    window.Battle.stop();
    window.Audio8 && window.Audio8.SFX.victory();
    player.defeated.push(window.STATIONS[currentStationIndex].id);
    // レベルアップ：通常HP+10/ATK+2、レアエンカウント勝利は HP+30/ATK+6（豪華）
    const isRare = !!enemy.isRare;
    const hpBoost = isRare ? 30 : 10;
    const atkBoost = isRare ? 6 : 2;
    player.maxHp += hpBoost;
    player.atk += atkBoost;
    player.hp = player.maxHp;
    // レアならボンタンも複数獲得
    if (isRare) {
      // ボンタン狩り演出側で1本は加わるので、ここで追加で1本
      player.bontans.push({ from: enemy.name + '(裏)', color: '#666' });
    }
    persist();
    showBontanCutscene(enemy, hpBoost, atkBoost, isRare);
  }

  function showBontanCutscene(enemy, hpBoost, atkBoost, isRare) {
    showScreen('screen-bontan');
    window.Audio8 && window.Audio8.stopBgm();
    // 主人公をリーゼント不良スプライトに（戦闘と同じ見た目）
    const bp = document.getElementById('bontan-player');
    if (window.Sprites && window.Sprites.delinquentHeadHTML) {
      const v = window.Sprites.VISUALS_BY_ARCHETYPE['player'];
      const bpHead = bp.querySelector('.char-head');
      bpHead.style.fontSize = '';
      bpHead.style.cssText = 'position:relative; width:52px; height:56px; zoom:1.5;';
      bpHead.innerHTML = window.Sprites.delinquentHeadHTML(v);
      bp.style.setProperty('--hair', v.hair);
      bp.style.setProperty('--skin', v.skin);
      bp.querySelector('.char-body').style.background = v.gak;
    }
    const victim = document.getElementById('bontan-victim');
    victim.style.right = '80px';
    victim.style.transition = '';
    victim.querySelector('.char-body').style.background = enemy.color; // 上着（学ラン）は着たまま
    const vBontan = victim.querySelector('.victim-bontan');
    const vTrunks = victim.querySelector('.victim-trunks');
    const vLegs = victim.querySelector('.victim-legs');
    vBontan.style.display = '';
    vBontan.style.background = enemy.bontanColor || '#1a1a2e';
    vTrunks.style.display = 'none';
    vLegs.style.display = 'none';
    document.getElementById('bontan-message').textContent = '';
    document.getElementById('bontan-levelup').textContent = '';
    const pants = document.getElementById('bontan-floating');
    pants.classList.remove('fly');
    pants.style.background = enemy.bontanColor || '#1a1a2e';

    setTimeout(() => {
      // ボンタンが剥がれて宙を舞う → 下半身はトランクス一丁に
      pants.classList.add('fly');
      vBontan.style.display = 'none';
      vTrunks.style.display = '';
      vLegs.style.display = '';
      window.Audio8 && window.Audio8.SFX.bontan();
      document.getElementById('bontan-message').textContent =
        `${enemy.name}のボンタンをGET！`;
    }, 700);

    setTimeout(() => {
      // 上着は着たまま、トランクス一丁で逃げる
      victim.style.transition = 'all 1.5s';
      victim.style.right = '-250px';
      document.getElementById('bontan-message').textContent =
        `${enemy.name}はトランクス一丁で逃げ去った！💨`;
    }, 1800);

    setTimeout(() => {
      player.bontans.push({ from: enemy.name, color: enemy.bontanColor });
      const rareTag = isRare ? '<div style="color:#ff3366; font-size:22px; margin-bottom:6px">🎰 レアエンカウント勝利！ボーナス報酬！</div>' : '';
      document.getElementById('bontan-levelup').innerHTML = rareTag +
        `<span style="color:#0f0">⬆ HP最大値 +${hpBoost} (${player.maxHp})</span>　<span style="color:#ff0">⬆ ATK +${atkBoost} (${player.atk})</span>`;
      window.Audio8 && window.Audio8.SFX.levelup && window.Audio8.SFX.levelup();
      persist();
    }, 2400);
  }

  function nextStation() {
    currentStationIndex++;
    persist();
    if (currentStationIndex >= window.STATIONS.length) {
      showVictoryScreen();
      return;
    }
    showScreen('screen-map');
    window.MapUI.render();
    window.Audio8 && window.Audio8.startBgm('map');
  }

  function onBattleLose() {
    window.Battle.stop();
    window.Audio8 && window.Audio8.SFX.defeat();
    window.Audio8 && window.Audio8.stopBgm();
    showScreen('screen-defeat');
  }

  function retry() {
    player.hp = player.maxHp;
    persist();
    startBattle();
  }

  function backToTitle() {
    init();
  }

  function showVictoryScreen() {
    showScreen('screen-victory');
    window.Audio8 && window.Audio8.SFX.victory();
    setTimeout(() => window.Audio8 && window.Audio8.SFX.victory(), 500);
    const display = document.getElementById('victory-bontans');
    display.innerHTML = player.bontans.map(b =>
      `<span class="bontan-icon" style="background:${b.color}" title="${b.from}"></span>`
    ).join('');
    // クリア後はセーブを消す（リプレイ用）
    window.Save && window.Save.clear();
  }

  function getPlayer() { return player; }
  function getCurrentStationIndex() { return currentStationIndex; }

  return {
    init, newGame, continueGame, startGame, boardStation, nextStation, retry,
    backToTitle, getPlayer, getCurrentStationIndex, showScreen
  };
})();

// イベントバインド
window.addEventListener('DOMContentLoaded', () => {
  window.Game.init();

  // 初回ユーザー操作でAudioContext起動 & タイトルBGM再生
  let audioStarted = false;
  function ensureAudio() {
    if (audioStarted) return;
    audioStarted = true;
    if (!window.Audio8) return;
    window.Audio8.init();
    window.Audio8.resumeIfSuspended && window.Audio8.resumeIfSuspended();
    // タイトル画面ならBGM再開
    if (document.getElementById('screen-title').classList.contains('active')) {
      window.Audio8.startBgm('title');
    }
  }
  document.addEventListener('touchstart', ensureAudio, { once: true, passive: true });
  document.addEventListener('click', ensureAudio, { once: true });
  document.addEventListener('keydown', ensureAudio, { once: true });

  document.getElementById('btn-start').addEventListener('click', () => {
    window.Audio8 && window.Audio8.SFX.menu();
    window.Game.newGame();
  });
  document.getElementById('btn-continue').addEventListener('click', () => {
    window.Audio8 && window.Audio8.SFX.menu();
    window.Game.continueGame();
  });
  document.getElementById('btn-board').addEventListener('click', () => {
    window.Audio8 && window.Audio8.SFX.menu();
    window.Game.boardStation();
  });
  document.getElementById('btn-bontan-next').addEventListener('click', () => {
    window.Audio8 && window.Audio8.SFX.menu();
    window.Game.nextStation();
  });
  document.getElementById('btn-retry').addEventListener('click', () => {
    window.Audio8 && window.Audio8.SFX.menu();
    window.Game.retry();
  });
  document.getElementById('btn-defeat-title').addEventListener('click', () => {
    window.Audio8 && window.Audio8.SFX.menu();
    window.Game.backToTitle();
  });
  document.getElementById('btn-newgame').addEventListener('click', () => {
    window.Audio8 && window.Audio8.SFX.menu();
    window.Game.newGame();
  });

  // ミュートトグル
  const muteBtn = document.getElementById('btn-mute');
  muteBtn.addEventListener('click', () => {
    if (!window.Audio8) return;
    const muted = window.Audio8.toggleMute();
    muteBtn.textContent = muted ? '🔇' : '🔊';
  });
});
