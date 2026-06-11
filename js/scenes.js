// 全23駅の駅前ステージシーンデータ
// 各シーンは sky(空のグラデ)、ground(地面)、deco(配置物)で構成
// deco: { e=絵文字 or text, x=横位置%, y=縦位置%(0=上), s=サイズpx, r=回転deg? }
window.SCENES = {

  // ==== 蒲郡線 ====
  'gamagori': {
    name: '蒲郡駅前 (海とホテル蒲郡)',
    sky: 'linear-gradient(180deg, #87ceeb 0%, #c4e4f5 60%, #4a7fa5 60%, #1a5577 100%)',
    ground: 'linear-gradient(180deg, #888 0%, #555 100%)',
    groundH: 30,
    deco: [
      { e: '🏨', x: 75, y: 25, s: 60 },
      { e: '⛰', x: 10, y: 30, s: 70 },
      { e: '⛵', x: 50, y: 50, s: 28 },
      { e: '🌊', x: 30, y: 55, s: 24 },
      { e: '🌊', x: 65, y: 56, s: 24 },
      { e: '🚉', x: 20, y: 60, s: 50 }
    ]
  },
  'gamagori-kyoutei': {
    name: '蒲郡競艇場前 (賭博と裏稼業の街)',
    sky: 'linear-gradient(180deg, #3a2a4a 0%, #5a3a5a 40%, #2a2a4a 60%, #0a0a2a 100%)',
    ground: 'linear-gradient(180deg, #555, #222)',
    groundH: 30,
    deco: [
      { e: '🏟', x: 50, y: 25, s: 75 },
      { e: '🚤', x: 25, y: 50, s: 32 },
      { e: '🎰', x: 75, y: 38, s: 50 },
      { e: '🎫', x: 15, y: 80, s: 28 },
      { e: '🎫', x: 35, y: 82, s: 24 },
      { e: '🎫', x: 65, y: 80, s: 28 },
      { e: '🍺', x: 80, y: 80, s: 28 },
      { e: '🚬', x: 50, y: 85, s: 24 },
      { e: '💴', x: 90, y: 50, s: 36 }
    ]
  },
  'mikawa-kashima': {
    name: '三河鹿島駅前',
    sky: 'linear-gradient(180deg, #fff4d4 0%, #ffd4a8 60%, #6b8e23 60%, #3a5a1a 100%)',
    ground: 'linear-gradient(180deg, #7a9a4a, #4a6a2a)',
    groundH: 35,
    deco: [
      { e: '🦌', x: 80, y: 45, s: 40 },
      { e: '🌳', x: 10, y: 30, s: 60 },
      { e: '🌳', x: 25, y: 32, s: 50 },
      { e: '⛩', x: 50, y: 35, s: 55 },
      { e: '🌿', x: 40, y: 80, s: 24 }
    ]
  },
  'katahara': {
    name: '形原駅前 (ミカン畑)',
    sky: 'linear-gradient(180deg, #87ceeb 0%, #b8e0f7 60%, #6b8e23 60%, #3a5a1a 100%)',
    ground: 'linear-gradient(180deg, #6b8e23, #3a5a1a)',
    groundH: 32,
    deco: [
      { e: '🍊', x: 15, y: 50, s: 32 },
      { e: '🍊', x: 25, y: 55, s: 28 },
      { e: '🍊', x: 75, y: 52, s: 32 },
      { e: '🍊', x: 88, y: 55, s: 28 },
      { e: '🌳', x: 10, y: 35, s: 50 },
      { e: '🌳', x: 90, y: 35, s: 50 },
      { e: '⛵', x: 50, y: 58, s: 24 }
    ]
  },
  'nishiura': {
    name: '西浦温泉郷',
    sky: 'linear-gradient(180deg, #ffd4e8 0%, #ffb4c8 60%, #5a3a2a 60%, #2a1a0a 100%)',
    ground: 'linear-gradient(180deg, #6a4a3a, #3a2010)',
    groundH: 32,
    deco: [
      { e: '♨️', x: 30, y: 40, s: 50 },
      { e: '♨️', x: 70, y: 42, s: 50 },
      { e: '🏯', x: 50, y: 30, s: 60 },
      { e: '💨', x: 25, y: 30, s: 32 },
      { e: '💨', x: 75, y: 32, s: 32 }
    ]
  },
  'kodomonokuni': {
    name: 'こどもの国',
    sky: 'linear-gradient(180deg, #ffeb99 0%, #ffccff 60%, #66cc66 60%, #339933 100%)',
    ground: 'linear-gradient(180deg, #66cc66, #339933)',
    groundH: 35,
    deco: [
      { e: '🎡', x: 70, y: 25, s: 75 },
      { e: '🎢', x: 20, y: 35, s: 60 },
      { e: '🎠', x: 50, y: 60, s: 36 },
      { e: '🎈', x: 15, y: 15, s: 32 },
      { e: '🎈', x: 80, y: 18, s: 28 },
      { e: '🍭', x: 35, y: 75, s: 28 }
    ]
  },
  'higashi-hazu': {
    name: '東幡豆 (干潟)',
    sky: 'linear-gradient(180deg, #87ceeb 0%, #c4e4f5 60%, #d4b896 60%, #8b6f47 100%)',
    ground: 'linear-gradient(180deg, #c4a878, #8b6f47)',
    groundH: 35,
    deco: [
      { e: '🦪', x: 20, y: 65, s: 32 },
      { e: '🦀', x: 70, y: 70, s: 36 },
      { e: '🦪', x: 50, y: 72, s: 28 },
      { e: '🦪', x: 85, y: 68, s: 28 },
      { e: '⛵', x: 30, y: 50, s: 36 },
      { e: '🌊', x: 60, y: 55, s: 28 }
    ]
  },
  'nishi-hazu': {
    name: '西幡豆 (漁港)',
    sky: 'linear-gradient(180deg, #87ceeb 0%, #b8e0f7 50%, #2a5a7f 50%, #0e3a5f 100%)',
    ground: 'linear-gradient(180deg, #888, #555)',
    groundH: 32,
    deco: [
      { e: '🚢', x: 75, y: 35, s: 55 },
      { e: '🐟', x: 30, y: 45, s: 28 },
      { e: '🎣', x: 20, y: 30, s: 40 },
      { e: '⚓', x: 50, y: 65, s: 32 },
      { e: '🦑', x: 65, y: 50, s: 28 }
    ]
  },
  'mikawa-toba': {
    name: '三河鳥羽 (火祭り)',
    sky: 'linear-gradient(180deg, #1a0a1a 0%, #5a1a1a 40%, #cc3322 70%, #ff6600 100%)',
    ground: 'linear-gradient(180deg, #8b3a1a, #4a1a0a)',
    groundH: 30,
    deco: [
      { e: '🔥', x: 50, y: 45, s: 80 },
      { e: '⛩', x: 25, y: 35, s: 60 },
      { e: '⛩', x: 75, y: 35, s: 60 },
      { e: '🔥', x: 20, y: 60, s: 36 },
      { e: '🔥', x: 80, y: 62, s: 36 },
      { e: '👹', x: 50, y: 70, s: 32 }
    ]
  },
  'kira-yoshida': {
    name: '吉良吉田 (吉良の里)',
    sky: 'linear-gradient(180deg, #6a4a8a 0%, #aa7aaa 40%, #4a4a3a 70%, #2a2a1a 100%)',
    ground: 'linear-gradient(180deg, #5a4a3a, #2a2010)',
    groundH: 35,
    deco: [
      { e: '🏯', x: 60, y: 25, s: 80 },
      { e: '⛩', x: 20, y: 35, s: 50 },
      { e: '🗡', x: 35, y: 55, s: 40 },
      { e: '🎎', x: 85, y: 55, s: 36 },
      { e: '🏮', x: 15, y: 60, s: 32 },
      { e: '🏮', x: 50, y: 62, s: 32 }
    ]
  },

  // ==== 西尾線 ====
  'kami-yokosuka': {
    name: '上横須賀 (裏路地・治安悪し)',
    sky: 'linear-gradient(180deg, #3a2a3a 0%, #5a3a4a 40%, #4a3a3a 60%, #1a1a1a 100%)',
    ground: 'linear-gradient(180deg, #555, #222)',
    groundH: 32,
    deco: [
      { e: '🚉', x: 25, y: 35, s: 55 },
      { e: '💢', x: 50, y: 30, s: 40 },
      { e: '🚬', x: 60, y: 78, s: 24 },
      { e: '🚬', x: 30, y: 80, s: 22 },
      { e: '🍺', x: 75, y: 80, s: 28 },
      { e: '🍺', x: 88, y: 78, s: 24 },
      { e: '🧥', x: 75, y: 45, s: 36 },
      { e: '🪧', x: 15, y: 50, s: 36 },
      { e: '🌑', x: 80, y: 18, s: 32 }
    ]
  },
  'fukuchi': {
    name: '福地',
    sky: 'linear-gradient(180deg, #ffd4a8 0%, #ffe8c4 60%, #6b8e23 60%, #3a5a1a 100%)',
    ground: 'linear-gradient(180deg, #6b8e23, #3a5a1a)',
    groundH: 35,
    deco: [
      { e: '⛩', x: 50, y: 30, s: 70 },
      { e: '🌾', x: 15, y: 60, s: 30 },
      { e: '🌾', x: 30, y: 62, s: 28 },
      { e: '🌾', x: 75, y: 60, s: 30 },
      { e: '🎰', x: 80, y: 45, s: 36 }
    ]
  },
  'nishio': {
    name: '西尾 (抹茶の闇・治安最悪)',
    sky: 'linear-gradient(180deg, #1a2a1a 0%, #2a3a1a 30%, #4a3a1a 60%, #0a1a0a 100%)',
    ground: 'linear-gradient(180deg, #2a4a1a, #0a2a00)',
    groundH: 40,
    deco: [
      { e: '🏯', x: 70, y: 25, s: 80 },
      { e: '🌑', x: 20, y: 18, s: 40 },
      { e: '🍵', x: 25, y: 55, s: 48 },
      { e: '🔥', x: 45, y: 50, s: 50 },
      { e: '🍵', x: 80, y: 65, s: 36 },
      { e: '💀', x: 15, y: 75, s: 36 },
      { e: '⚔️', x: 55, y: 70, s: 40 },
      { e: '🌿', x: 88, y: 80, s: 32 },
      { e: '⚡', x: 35, y: 25, s: 36 }
    ]
  },
  'nishio-guchi': {
    name: '西尾口',
    sky: 'linear-gradient(180deg, #a4b4c4 0%, #c4d4e4 60%, #5a5a5a 60%, #2a2a2a 100%)',
    ground: 'linear-gradient(180deg, #666, #333)',
    groundH: 32,
    deco: [
      { e: '🏬', x: 25, y: 30, s: 65 },
      { e: '🏪', x: 70, y: 35, s: 55 },
      { e: '🚉', x: 50, y: 40, s: 50 },
      { e: '🚦', x: 15, y: 55, s: 32 }
    ]
  },
  'sakuramachi-mae': {
    name: '桜町前 (商店街)',
    sky: 'linear-gradient(180deg, #ffe4f4 0%, #ffc4e8 60%, #888 60%, #555 100%)',
    ground: 'linear-gradient(180deg, #777, #444)',
    groundH: 32,
    deco: [
      { e: '🏪', x: 20, y: 30, s: 55 },
      { e: '🏪', x: 50, y: 30, s: 55 },
      { e: '🏪', x: 80, y: 30, s: 55 },
      { e: '🌸', x: 15, y: 18, s: 32 },
      { e: '🌸', x: 50, y: 15, s: 36 },
      { e: '🌸', x: 85, y: 18, s: 32 },
      { e: '🏮', x: 35, y: 50, s: 36 },
      { e: '🏮', x: 65, y: 50, s: 36 }
    ]
  },
  'yonezu': {
    name: '米津 (田んぼと矢作川)',
    sky: 'linear-gradient(180deg, #fff8d0 0%, #ffe8a0 60%, #88aa44 60%, #557722 100%)',
    ground: 'linear-gradient(180deg, #88aa44, #557722)',
    groundH: 38,
    deco: [
      { e: '🌾', x: 10, y: 55, s: 36 },
      { e: '🌾', x: 25, y: 58, s: 32 },
      { e: '🌾', x: 75, y: 56, s: 36 },
      { e: '🌾', x: 88, y: 60, s: 32 },
      { e: '🍙', x: 50, y: 70, s: 40 },
      { e: '🏯', x: 35, y: 35, s: 45 }
    ]
  },
  'minami-sakurai': {
    name: '南桜井 (桜並木)',
    sky: 'linear-gradient(180deg, #ffe4f4 0%, #ffc4e8 60%, #8b5a2b 60%, #5a3a1a 100%)',
    ground: 'linear-gradient(180deg, #aa7a4a, #6a4a2a)',
    groundH: 30,
    deco: [
      { e: '🌸', x: 10, y: 20, s: 60 },
      { e: '🌸', x: 30, y: 18, s: 65 },
      { e: '🌸', x: 50, y: 20, s: 70 },
      { e: '🌸', x: 70, y: 18, s: 65 },
      { e: '🌸', x: 90, y: 20, s: 60 },
      { e: '🌸', x: 20, y: 70, s: 28 },
      { e: '🌸', x: 60, y: 75, s: 24 }
    ]
  },
  'sakurai': {
    name: '桜井',
    sky: 'linear-gradient(180deg, #ffeef8 0%, #ffd0e8 60%, #6b8e23 60%, #3a5a1a 100%)',
    ground: 'linear-gradient(180deg, #6b8e23, #3a5a1a)',
    groundH: 32,
    deco: [
      { e: '🌸', x: 15, y: 25, s: 70 },
      { e: '🌸', x: 85, y: 25, s: 70 },
      { e: '🏫', x: 50, y: 35, s: 55 },
      { e: '🌸', x: 40, y: 70, s: 32 },
      { e: '💋', x: 65, y: 65, s: 36 }
    ]
  },
  'horiuchi-koen': {
    name: '堀内公園',
    sky: 'linear-gradient(180deg, #87ceeb 0%, #c4e4f5 60%, #5fa53f 60%, #3a8020 100%)',
    ground: 'linear-gradient(180deg, #5fa53f, #3a8020)',
    groundH: 38,
    deco: [
      { e: '🎠', x: 70, y: 28, s: 70 },
      { e: '🎪', x: 25, y: 30, s: 65 },
      { e: '🎢', x: 50, y: 35, s: 50 },
      { e: '🌳', x: 10, y: 40, s: 55 },
      { e: '🌳', x: 90, y: 42, s: 50 },
      { e: '🪑', x: 40, y: 70, s: 32 }
    ]
  },
  'hekikai-furui': {
    name: '碧海古井',
    sky: 'linear-gradient(180deg, #4a4a6a 0%, #2a2a4a 60%, #1a1a2a 60%, #0a0a1a 100%)',
    ground: 'linear-gradient(180deg, #2a2a3a, #0a0a1a)',
    groundH: 35,
    deco: [
      { e: '🕳', x: 50, y: 60, s: 70 },
      { e: '⛩', x: 25, y: 35, s: 50 },
      { e: '🌳', x: 80, y: 32, s: 60 },
      { e: '👻', x: 70, y: 55, s: 36 },
      { e: '🪦', x: 15, y: 65, s: 36 }
    ]
  },
  'minami-anjo': {
    name: '南安城 (商店街)',
    sky: 'linear-gradient(180deg, #f0d0a0 0%, #d0a070 50%, #4a4a4a 50%, #1a1a1a 100%)',
    ground: 'linear-gradient(180deg, #555, #222)',
    groundH: 35,
    deco: [
      { e: '🏬', x: 20, y: 25, s: 70 },
      { e: '🏬', x: 80, y: 25, s: 70 },
      { e: '🚉', x: 50, y: 30, s: 65 },
      { e: '🚦', x: 35, y: 55, s: 32 },
      { e: '💈', x: 65, y: 55, s: 36 }
    ]
  },
  'kita-anjo': {
    name: '北安城',
    sky: 'linear-gradient(180deg, #a0b0d0 0%, #708090 50%, #5a7030 50%, #2a4010 100%)',
    ground: 'linear-gradient(180deg, #5a7030, #2a4010)',
    groundH: 35,
    deco: [
      { e: '🚉', x: 35, y: 32, s: 60 },
      { e: '🏭', x: 75, y: 28, s: 60 },
      { e: '🌾', x: 15, y: 60, s: 32 },
      { e: '🌾', x: 50, y: 65, s: 28 },
      { e: '🚃', x: 30, y: 55, s: 40 }
    ]
  },
  'shin-anjo': {
    name: '新安城 (ラスボス決戦)',
    sky: 'linear-gradient(180deg, #2a0a1a 0%, #6a1a2a 30%, #cc3322 60%, #ff8844 100%)',
    ground: 'linear-gradient(180deg, #4a3a3a, #1a0a0a)',
    groundH: 30,
    deco: [
      { e: '🏢', x: 15, y: 20, s: 90 },
      { e: '🏢', x: 35, y: 18, s: 100 },
      { e: '🏢', x: 65, y: 18, s: 100 },
      { e: '🏢', x: 85, y: 20, s: 90 },
      { e: '🚆', x: 50, y: 50, s: 60 },
      { e: '👑', x: 50, y: 30, s: 48 },
      { e: '⚡', x: 20, y: 40, s: 40 },
      { e: '⚡', x: 80, y: 42, s: 40 }
    ]
  }
};
