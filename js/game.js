// ゲーム状態管理 / 画面遷移
window.Game = (function() {
  let player = null;
  let currentStationIndex = 0;

  // レアエンカウントのレア度（ガチャ的な変動報酬）。weight で抽選、上位ほど報酬大
  const RARITY = {
    bronze:  { label: '銅', mark: '🥉', color: '#cd7f32', moneyMul: 1.5, bontans: 1, hp: 20, atk: 4,  weight: 50 },
    silver:  { label: '銀', mark: '🥈', color: '#cfd6dd', moneyMul: 2.2, bontans: 2, hp: 35, atk: 6,  weight: 30 },
    gold:    { label: '金', mark: '🥇', color: '#ffd24a', moneyMul: 3.2, bontans: 3, hp: 50, atk: 9,  weight: 14 },
    rainbow: { label: '虹', mark: '🌈', color: 'rainbow', moneyMul: 5.0, bontans: 5, hp: 80, atk: 14, weight: 6 }
  };
  function rollRarity() {
    const total = Object.values(RARITY).reduce((s, r) => s + r.weight, 0);
    let n = Math.random() * total;
    for (const key of Object.keys(RARITY)) { n -= RARITY[key].weight; if (n <= 0) return key; }
    return 'bronze';
  }

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
    // 旧セーブ互換: 新フィールドの既定値を補完
    if (typeof player.money !== 'number') player.money = 0;
    if (!player.upgrades) player.upgrades = {};
    if (!player.bestScores) player.bestScores = {};
    if (!player.dexClaims) player.dexClaims = {};
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

  // ステージセレクト：路線図の駅タップで出撃先を変更（クリア済み駅の再戦も可）
  function selectStation(idx) {
    if (idx < 0 || idx >= window.STATIONS.length) return;
    currentStationIndex = idx;
    persist();
    window.MapUI.render();
    window.Audio8 && window.Audio8.SFX.menu();
  }

  // 「電車を降りる」 → 電車アニメ → 戦闘（クリア済み駅でも再戦できる）
  function boardStation() {
    const st = window.STATIONS[currentStationIndex];
    if (!st) return;
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
      enemy._rarity = rollRarity();   // 銅/銀/金/虹 を抽選（勝利時に報酬・演出へ反映）
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
    const stId = window.STATIONS[currentStationIndex].id;
    const firstClear = !player.defeated.includes(stId);
    const isRare = !!enemy.isRare;
    const tier = isRare ? RARITY[enemy._rarity] || RARITY.bronze : null;   // レア度（銅/銀/金/虹）
    // スコア/ランク: 自己ベストを記録（再戦リプレイの動機）
    const res = enemy.battleResult;
    if (res) {
      if (!player.bestScores) player.bestScores = {};
      const prev = player.bestScores[stId] || 0;
      res.isNewBest = res.score > prev;
      if (res.isNewBest) player.bestScores[stId] = res.score;
      // カツアゲ金: スコア連動＋クリアボーナス。レアはレア度倍率を乗算（変動報酬）
      res.money = Math.round(res.score / 4) + (firstClear ? 80 : 25);
      if (tier) res.money = Math.round(res.money * tier.moneyMul) + 100;
      player.money = (player.money || 0) + res.money;
    }
    let hpBoost = 0, atkBoost = 0;
    if (firstClear) {
      player.defeated.push(stId);
      // レベルアップ：通常HP+10/ATK+2、レアはレア度ティアで豪華に
      hpBoost = tier ? tier.hp : 10;
      atkBoost = tier ? tier.atk : 2;
      player.maxHp += hpBoost;
      player.atk += atkBoost;
      // レアならレア度に応じた本数のボンタンを追加獲得（演出側で1本加わるので -1 本）
      if (tier) {
        for (let i = 0; i < Math.max(0, tier.bontans - 1); i++)
          player.bontans.push({ from: enemy.name + '(裏)', color: tier.color === 'rainbow' ? '#a0f' : tier.color });
      }
    }
    player.hp = player.maxHp;
    persist();
    showBontanCutscene(enemy, hpBoost, atkBoost, isRare, firstClear, tier);
  }

  function showBontanCutscene(enemy, hpBoost, atkBoost, isRare, firstClear, tier) {
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
    // 倒したボスの顔を表示（スマホでも誰を倒したか分かるよう、その駅のボスの見た目に）
    if (window.Sprites && window.Sprites.delinquentHeadHTML && window.STATION_ARCHETYPE) {
      const stId2 = window.STATIONS[currentStationIndex].id;
      const arche = window.STATION_ARCHETYPE[stId2] || 'yankee-basic';
      const bv = window.Sprites.VISUALS_BY_ARCHETYPE[arche] || window.Sprites.VISUALS_BY_ARCHETYPE['yankee-basic'];
      const vHead = victim.querySelector('.char-head');
      if (vHead && bv) {
        vHead.style.cssText = 'position:relative; width:52px; height:56px; zoom:1.5;';
        vHead.innerHTML = window.Sprites.delinquentHeadHTML(bv);
        victim.style.setProperty('--hair', bv.hair || '#1a140e');
        victim.style.setProperty('--skin', bv.skin || '#f2c899');
      }
    }
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

    // スコア/ランクのHTML（評価＋自己ベスト）
    const res2 = enemy.battleResult;
    let rankHtml = '';
    if (res2) {
      const col = { S: '#ffcc00', A: '#ff6699', B: '#66ccff', C: '#bbbbbb' }[res2.rank] || '#fff';
      const best = res2.isNewBest ? ' <span style="color:#ff3366">🏆ベスト更新!</span>' : '';
      const noHitTag = res2.noHit ? ' <span style="color:#9f9">ノーダメ!</span>' : '';
      const moneyTag = res2.money ? `　<span style="color:#ffd700">💴+${res2.money}円</span>` : '';
      rankHtml =
        `<div style="margin-top:8px; font-size:15px">` +
        `<span style="font-size:30px; font-weight:bold; color:${col}">${res2.rank}</span>ランク　` +
        `SCORE <b>${res2.score}</b>${best}${moneyTag}<br>` +
        `<span style="color:#ccc; font-size:13px">最大${res2.maxCombo}コンボ・${res2.timeSec}秒${noHitTag}</span></div>`;
    }

    setTimeout(() => {
      const lv = document.getElementById('bontan-levelup');
      if (firstClear === false) {
        // 再戦勝利：ボンタン・強化なし（ただしスコア/ランクは出してリプレイ動機に）
        lv.innerHTML =
          '<span style="color:#999">再戦勝利！（クリア済みの駅なので強化ボーナスなし）</span>' + rankHtml;
        if (res2 && res2.isNewBest) window.Audio8 && window.Audio8.SFX.levelup && window.Audio8.SFX.levelup();
        return;
      }
      player.bontans.push({ from: enemy.name, color: enemy.bontanColor });
      // レア度ティアの「当たり」バナー（ガチャ的演出）
      let rareTag = '';
      if (tier) {
        const isRainbow = tier.color === 'rainbow';
        const style = isRainbow
          ? 'class="rarity-banner rainbow"'
          : `class="rarity-banner" style="color:${tier.color}; text-shadow:0 0 10px ${tier.color}"`;
        rareTag = `<div ${style}>${tier.mark} ${tier.label}レア 当たり！！ 🎰</div>`;
      }
      lv.innerHTML = rareTag +
        `<span style="color:#0f0">⬆ HP最大値 +${hpBoost} (${player.maxHp})</span>　<span style="color:#ff0">⬆ ATK +${atkBoost} (${player.atk})</span>` +
        rankHtml;
      // レア度が高いほど派手なファンファーレ
      if (window.Audio8) {
        Audio8.SFX.levelup && Audio8.SFX.levelup();
        if (tier) {
          const extra = { bronze: 0, silver: 1, gold: 2, rainbow: 4 }[enemy._rarity] || 0;
          for (let i = 0; i < extra; i++) setTimeout(() => Audio8.SFX.victory && Audio8.SFX.victory(), 180 + i * 160);
          if (tier.color === 'rainbow') setTimeout(() => Audio8.SFX.final && Audio8.SFX.final(), 120);
        }
      }
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
    backToTitle, getPlayer, getCurrentStationIndex, showScreen, selectStation, persist
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
