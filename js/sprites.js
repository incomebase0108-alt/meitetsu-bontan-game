// CSS手足キャラ（くにおくん風 2頭身・config駆動）描画モジュール
// 2026-06-14 大転換: Blender/PNG経路を撤去し、全キャラを手足div＋CSSアニメで描画。
//   向きは belt.js が親 .entity に scaleX(e.dir) を付ける。歩き=.walking、攻撃=.act-*、被弾=.hit/.down-pose、cower=.dq-face.scared。
// delinquentHeadHTML / VISUALS_BY_ARCHETYPE は game.js のボンタン狩り演出が参照するため温存（旧CSS頭）。
window.Sprites = (function() {

  // ---- 旧CSS頭（game.jsのボンタン狩り犠牲者演出用に温存） ----
  const VISUALS_BY_ARCHETYPE = {
    'player':        { hair: '#15151c', gak: '#191921', skin: '#f2c899', sarashi: true },
    'yankee-basic':  { hair: '#1a140e' },
    'yankee-fisher': { hair: '#10202a', acc: '🎣' },
    'yankee-fire':   { hair: '#3a0d05', acc: '🔥' },
    'kid-boss':      { hair: '#4a2c10', acc: '🍭', scale: 0.82 },
    'samurai-yanki': { hair: '#0d0d18', acc: '👑', scar: true },
    'matcha-boss':   { hair: '#1c2e10', acc: '🍃', scar: true },
    'girl-yankee':   { hair: '#d4a017', acc: '🎀' },
    'big-boss':      { hair: '#241505', acc: '💪', scale: 1.22, scar: true },
    'final-boss':    { hair: '#ececec', gak: '#f2f0e8', acc: '👑', scar: true, white: true },
    'yakuza':        { hair: '#23201c', gak: '#0c0c10', shades: true, scar: true },
    'gambler-boss':  { hair: '#2c1a3a', acc: '🎲' },
    'thrower-boss':  { hair: '#33200c', acc: '🎯' },
    'onsen-boss':    { hair: '#5a4a42', acc: '♨️' },
    'riezent-boss':  { hair: '#050505', acc: '💈', pompXL: true },
    'karate-boss':   { hair: '#1a1a1a', acc: '🥋', scar: true },
    'skinhead':      { bald: true, tattoo: true, blade: true, skin: '#e8b486', gak: '#26262e', scar: true }
  };
  function delinquentHeadHTML(v) {
    const hair = v.bald
      ? `<div class="dq-dome"></div>${v.tattoo ? '<div class="dq-tattoo">龍</div>' : ''}`
      : `<div class="dq-hair${v.pompXL ? ' xl' : ''}"><div class="dq-pomp"></div></div>`;
    return `
      <div class="dq-face">
        <div class="dq-brow l"></div><div class="dq-brow r"></div>
        ${v.shades ? '<div class="dq-shades"></div>' : '<div class="dq-eye l"></div><div class="dq-eye r"></div>'}
        <div class="dq-mouth"></div>
        ${v.scar ? '<div class="dq-scar"></div>' : ''}
      </div>
      ${hair}`;
  }

  // ---- 新CSS手足キャラ config ----
  // body: slim|normal|big|tall / hair: pomp|pompXL|mohawk|skinhead / outfit色=gak
  // face: normal|smirk|shout / flags: scar shades mask sarashi belt white tattoo
  // weapon: bat|pipe|blade|bokuto / extras: cig chain
  const CFX = {
    // 主人公の初期＝真面目少年（普通短髪・穏やか顔・きれいな学ラン・傷/さらし/小物なし）。
    //   アイテム取得で cosmetics により不良化していく（applyCharSprite の data.cosmetics で差し替え）。
    'player':        { hair:'plain', face:'plain', hairColor:'#241a12', gak:'#222633', bontan:'#1b1f2a', skin:'#f2c79b' },
    // 髪型を散らして単調回避（リーゼントは一部だけ）
    'yankee-basic':  { hair:'pomp',     hairColor:'#1a140e', gak:'#3a2a1c', bontan:'#241a10', cig:true },
    'yankee-fisher': { body:'slim', hair:'flat', hairColor:'#10202a', gak:'#234a52', bontan:'#16323a', face:'smirk' },
    'yankee-fire':   { hair:'punch',   hairColor:'#3a0d05', gak:'#5a1810', bontan:'#3a1008', face:'shout', scar:true },
    'kid-boss':      { body:'slim', hair:'buzz', hairColor:'#4a2c10', gak:'#5a3a52', bontan:'#3a2438', weapon:'bat' },
    'samurai-yanki': { hair:'long',    hairColor:'#0d0d18', gak:'#2a2030', bontan:'#1a141f', scar:true },
    'matcha-boss':   { hair:'allback', hairColor:'#1c2e10', gak:'#1c3a1c', bontan:'#12240f', scar:true },
    'girl-yankee':   { body:'slim', hair:'long', hairColor:'#d4a017', gak:'#7a2a52', bontan:'#3a1a30' },
    'big-boss':      { body:'big', hair:'punch', hairColor:'#241505', gak:'#4a2a1a', bontan:'#2a1810', scar:true, chain:true },
    'final-boss':    { body:'big', hair:'allback', white:true, hairColor:'#cfd2da', gak:'#e8e6dc', bontan:'#e2e0d6', scar:true, belt:true, weapon:'bat' },
    'yakuza':        { body:'slim', hair:'allback', hairColor:'#23201c', gak:'#0c0c12', bontan:'#0a0a10', shades:true, scar:true },
    'gambler-boss':  { hair:'allback', hairColor:'#2c1a3a', gak:'#3a2a4a', bontan:'#241830' },
    'thrower-boss':  { hair:'buzz',    hairColor:'#33200c', gak:'#4a3a1a', bontan:'#2a2410' },
    'onsen-boss':    { body:'big', hair:'buzz', hairColor:'#5a4a42', gak:'#6a4a3a', bontan:'#3a281f' },
    'riezent-boss':  { hair:'pompXL',  hairColor:'#050505', gak:'#3a2a1c', bontan:'#241810', scar:true, weapon:'bat' },
    'karate-boss':   { hair:'buzz',    hairColor:'#1a1a1a', gak:'#2a2a30', bontan:'#1a1a20', scar:true },
    'skinhead':      { hair:'skinhead', tattoo:true, shades:true, scar:true, weapon:'blade', skin:'#e8b486', gak:'#26262e', bontan:'#15151b' },
    // ===== 23駅 固有config（改名表ブリーフ準拠・順次追加） =====
    // 蒲郡／蒲生健司: 港町の漁師上がり。日焼け・刈上げ・腹巻・ゴム長・銛、がっしり
    'gamo':          { body:'big', hair:'flat', hairColor:'#191712', gak:'#2c4a52', bontan:'#1d3036',
                       skin:'#cf9a63', outfit:'work', sarashi:true, boots:true, weapon:'harpoon', face:'shout' },
    // 競艇場前／真田雅彦: 博徒チンピラ。アロハ＋サングラス＋オールバック、痩せ型・悪笑み
    'sanada':        { body:'slim', hair:'allback', hairColor:'#1a1712', gak:'#1f7a6a', bontan:'#143b34',
                       outfit:'aloha', shades:true, face:'smirk', skin:'#e8b486' },
    // 形原／片原大輔: みかん農家の若者。麦わら帽＋前掛け、日焼け・素朴
    'katahara':      { body:'normal', hair:'plain', hairColor:'#241a10', gak:'#7a5a2a', bontan:'#3a2c16',
                       skin:'#d6a064', straw:true, apron:true, face:'plain' },
    // 西浦／湯浅治: 温泉旅館の番頭くずれ。丹前＋鉢巻＋桶、ずんぐり
    'yuasa':         { body:'big', hair:'buzz', hairColor:'#2a2620', gak:'#3a5a6a', bontan:'#24323a',
                       outfit:'robe', hachimaki:true, bucket:true, face:'shout' },
    // 三河鹿島／鹿島修: 寡黙な漁港の大男。短髪・ウェットスーツ・銛、大型
    'kashima':       { body:'big', hair:'buzz', hairColor:'#15140f', gak:'#2b333e', bontan:'#1b2027',
                       skin:'#c89058', outfit:'work', weapon:'harpoon', scar:true, face:'shout' },
    // 東幡豆／富田智明: 潮干狩りの漁師。ロン毛＋入れ墨・熊手・バケツ・痩躯ニヒル
    'tomita':        { body:'slim', hair:'long', hairColor:'#161410', gak:'#3a3a30', bontan:'#24241c',
                       skin:'#cf9a63', irezumi:true, boots:true, weapon:'rake', bucket:true, face:'smirk' },
    // 西幡豆／羽豆竜也: 背中に龍刺青の若頭格。長ラン肩掛け・鋭い目・細身長身
    'hazu':          { body:'tall', hair:'allback', hairColor:'#0d0d12', gak:'#15151c', bontan:'#0c0c12',
                       drape:true, scar:true },
    // 上横須賀／尾崎清則: こわもての筋肉・鳶の格好（ニッカポッカ＋腹掛け＋手ぬぐい＋地下足袋）
    'ozaki':         { body:'big', hair:'buzz', hairColor:'#14130f', gak:'#1c2a4a', bontan:'#16223a',
                       skin:'#c08a52', outfit:'work', nikka:true, haragake:true, hachimaki:true, scar:true, face:'shout' },
    // 三河鳥羽／鳥羽修司: 火祭りの暴れ者。般若面を首に下げた大柄・坊主＋作業衣・威圧
    'toba':          { body:'big', hair:'buzz', hairColor:'#15140f', gak:'#5a2418', bontan:'#3a160e',
                       skin:'#c89058', outfit:'work', hannya:true, scar:true, face:'shout' },
    // 吉良吉田／吉良雅樹: 名家のボンボン不良。金髪＋白スーツ襟立て＋木刀、優雅で冷酷
    'kira':          { body:'slim', hair:'allback', hairColor:'#d8b43a', gak:'#ece9e0', bontan:'#cfc9ba',
                       outfit:'suit', weapon:'bokuto', face:'smirk', scar:true },
    // 米津／米田剛: 米屋の巨漢。米俵パワー・超大型
    'yoneda':        { body:'big', hair:'buzz', hairColor:'#1c160e', gak:'#4a3a22', bontan:'#2e2414',
                       skin:'#d0a064', bale:true, face:'shout', scar:true }
  };

  function buildCfxHTML(c) {
    // 髪型カタログ: plain(七三短髪)/pomp(リーゼント)/pompXL(超ロング)/mohawk/skinhead/
    //   long(ロン毛)/buzz(坊主)/flat(角刈り)/punch(パンチパーマ)/allback(オールバック)/afro(パーマ)
    let head = '';
    switch (c.hair) {
      case 'skinhead': head = ''; break;                                  // 髪なし（坊主頭）
      case 'plain':    head = `<div class="cfx-crop"></div>`; break;       // 真面目少年
      case 'mohawk':   head = `<div class="cfx-hair"><div class="cfx-pomp"></div></div><div class="cfx-mohawk"></div>`; break;
      case 'long':     head = `<div class="cfx-long"></div>`; break;
      case 'buzz':     head = `<div class="cfx-buzz"></div>`; break;
      case 'flat':     head = `<div class="cfx-flat"></div>`; break;
      case 'punch':    head = `<div class="cfx-punch"></div>`; break;
      case 'allback':  head = `<div class="cfx-allback"></div>`; break;
      case 'afro':     head = `<div class="cfx-afro"></div>`; break;
      default:         head = `<div class="cfx-hair"><div class="cfx-pomp"></div></div>`; break;  // pomp/pompXL
    }
    if (c.streak) head += `<div class="cfx-streak"></div>`;                // 白髪交じりの筋
    if (c.straw) head += `<div class="cfx-straw"></div>`;                  // 麦わら帽
    if (c.hachimaki) head += `<div class="cfx-hachimaki"></div>`;          // 鉢巻
    if (c.tattoo) head += `<div class="cfx-tattoo">龍</div>`;
    const eyes = c.shades ? `<div class="cfx-shades"></div>`
                          : `<div class="dq-eye l"></div><div class="dq-eye r"></div>`;
    const faceCls = c.face ? (' ' + c.face) : '';
    const weapon = c.weapon ? `<div class="cfx-${c.weapon}"></div>` : '';
    return `
      <div class="cfx-arm back"><div class="up"></div><div class="ft"></div></div>
      <div class="cfx-leg l"><div class="th"></div><div class="sh"></div></div>
      <div class="cfx-leg r"><div class="th"></div><div class="sh"></div></div>
      ${c.chain ? '<div class="cfx-chain"></div>' : ''}
      ${c.drape ? '<div class="cfx-drape"></div>' : ''}
      <div class="cfx-torso${c.white ? ' white' : ''}">${c.sarashi ? '<div class="cfx-sarashi"></div>' : ''}${c.belt ? '<div class="cfx-belt"></div>' : ''}${c.outfit === 'robe' ? '<div class="cfx-obi"></div>' : ''}${c.outfit === 'suit' ? '<div class="cfx-lapel"></div>' : ''}</div>
      ${c.irezumi ? '<div class="cfx-irezumi"></div>' : ''}
      ${c.haragake ? '<div class="cfx-haragake"></div>' : ''}
      ${c.hannya ? '<div class="cfx-hannya"></div>' : ''}
      ${c.necklace ? '<div class="cfx-necklace"></div>' : ''}
      ${c.apron ? '<div class="cfx-apron"></div>' : ''}
      ${c.bucket ? '<div class="cfx-bucket"></div>' : ''}
      ${c.bale ? '<div class="cfx-bale"></div>' : ''}
      <div class="cfx-head${faceCls}">
        ${head}
        <div class="dq-face">
          <div class="dq-brow l"></div><div class="dq-brow r"></div>
          ${eyes}
          <div class="dq-mouth"></div>
          ${c.mask ? '<div class="cfx-mask"></div>' : ''}${c.scar ? '<div class="cfx-scar"></div>' : ''}
        </div>
      </div>
      ${c.cig ? '<div class="cfx-cig"></div>' : ''}
      <div class="cfx-arm front"><div class="up"></div><div class="ft"></div></div>
      ${weapon}`;
  }

  // 主人公カスタム: アイテムで取得した cosmetics を config に反映（不良化）。
  // schema: { body, hair, hairColor, outfit, outfitColor, face, sarashi, scar, props:[], accColor }
  // shop/save/通貨の配線は1号機。ここは描画キーへのマッピングのみ。
  function applyCosmetics(c, cm) {
    if (cm.body) c.body = cm.body;
    if (cm.hair) c.hair = cm.hair;                 // plain|pomp|pompXL|mohawk|skinhead
    if (cm.hairColor) c.hairColor = cm.hairColor;
    if (cm.outfitColor) c.gak = cm.outfitColor;
    if (cm.bontanColor) c.bontan = cm.bontanColor;
    if (cm.outfit === 'white-tokko') { c.white = true; c.belt = true; }
    if (cm.outfit === 'tokkofuku') { c.sarashi = true; }
    if (cm.face === 'shades') c.shades = true;
    else if (cm.face === 'mask') c.mask = true;
    else if (cm.face && cm.face !== 'plain') c.face = cm.face;  // smirk/shout等
    if (cm.sarashi !== undefined) c.sarashi = cm.sarashi;
    if (cm.scar) c.scar = true;
    if (cm.tattoo) c.tattoo = true;
    (cm.props || []).forEach(p => {
      if (['bat', 'pipe', 'blade', 'bokuto'].indexOf(p) >= 0) c.weapon = p;
      else if (p === 'cigarette') c.cig = true;
      else if (p === 'chain') c.chain = true;
    });
    return c;
  }

  // charEl（.fighter）に手足キャラを適用。aura/shadow/mini-hp は温存。戻り値=推奨スケール。
  function applyCharSprite(charEl, archetypeId, data) {
    data = data || {};
    const base = CFX[archetypeId] || CFX['yankee-basic'];
    const c = Object.assign({}, base);
    if (data.cosmetics) applyCosmetics(c, data.cosmetics);   // 主人公の着せ替え（不良化）

    charEl.classList.add('dq', 'cssx');
    // 体型・髪型・表情のクラス
    ['slim', 'big', 'tall'].forEach(b => charEl.classList.toggle(b, c.body === b));
    charEl.classList.toggle('xl', c.hair === 'pompXL');
    charEl.classList.toggle('bald', c.hair === 'skinhead');
    charEl.classList.toggle('mohawk', c.hair === 'mohawk');
    charEl.classList.toggle('has-streak', !!c.streak);
    charEl.classList.toggle('boots', !!c.boots);
    charEl.classList.toggle('o-work', c.outfit === 'work');
    charEl.classList.toggle('o-aloha', c.outfit === 'aloha');
    charEl.classList.toggle('o-robe', c.outfit === 'robe');
    charEl.classList.toggle('o-suit', c.outfit === 'suit');
    charEl.classList.toggle('nikka', !!c.nikka);

    // 配色（data上書き対応：旧API互換 hairOverride/gakOverride/color/bontanColor）
    charEl.style.setProperty('--hair', data.hairOverride || c.hairColor || '#15110c');
    charEl.style.setProperty('--gak',  data.gakOverride  || c.gak || data.color || '#23232b');
    charEl.style.setProperty('--skin', c.skin || '#f0c08a');
    charEl.style.setProperty('--bontan', data.bontanColor || c.bontan || '#1a1a1a');

    // 既存の .cfx を作り直し（再適用に備える）。aura/shadow/accessory/mini-hp/dq-fist/dq-foot は残す。
    const old = charEl.querySelector('.cfx');
    if (old) old.remove();
    const cfx = document.createElement('div');
    cfx.className = 'cfx';
    if (data.spriteHue) cfx.style.filter = `hue-rotate(${data.spriteHue}deg)`; // 雑魚の色違い
    cfx.innerHTML = buildCfxHTML(c);
    charEl.appendChild(cfx);

    return data.isBig ? 1.22 : (c.body === 'big' ? 1.12 : 1);
  }

  return { applyCharSprite, delinquentHeadHTML, VISUALS_BY_ARCHETYPE, CFX };
})();
