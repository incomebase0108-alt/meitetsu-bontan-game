// 名鉄蒲郡線 + 西尾線 全23駅データ
// 蒲郡 → 新安城 の順（プレイヤーは蒲郡から出発）
// 各駅に固有の不良ボス1人

window.STATIONS = [
  // ==== 蒲郡線 ====
  {
    id: 'gamagori',
    name: '蒲郡',
    kana: 'がまごおり',
    line: '名鉄蒲郡線',
    distanceFromPrev: 0,
    enemy: {
      name: '蒲生 健司',
      title: '蒲郡を仕切る男',
      hp: 40,
      atk: 5,
      speed: 3,
      color: '#2d5016',
      emoji: '🐸',
      voice: 'ここから先は通さない。悪いが痛い目を見てもらう',
      bontanColor: '#1a3d0f'
    }
  },
  {
    id: 'gamagori-kyoutei',
    name: '蒲郡競艇場前',
    kana: 'がまごおりきょうていじょうまえ',
    line: '名鉄蒲郡線',
    distanceFromPrev: 2.3,
    danger: 2,
    gambleNote: 'ヤクザ遭遇率30%',
    enemy: {
      name: '真田 雅彦',
      title: '競艇場に居着いた男',
      hp: 50,
      atk: 6,
      speed: 4,
      color: '#0066cc',
      emoji: '🚤',
      voice: 'いい度胸だ。ここはそんな甘い場所じゃない',
      bontanColor: '#003d7a'
    },
    rareEnemy: {
      name: '舟橋 竜三',
      title: '競艇場の裏を仕切る男',
      hp: 200,
      atk: 28,
      speed: 9,
      color: '#1a1a1a',
      emoji: '🐍',
      voice: 'このシマを荒らしたな…タダで帰れると思うなよ',
      bontanColor: '#000',
      isRare: true
    },
    rareChance: 0.3
  },
  {
    id: 'mikawa-kashima',
    name: '三河鹿島',
    kana: 'みかわかしま',
    line: '名鉄蒲郡線',
    distanceFromPrev: 1.8,
    enemy: {
      name: '鹿島 修',
      title: '三河鹿島の顔役',
      hp: 55,
      atk: 7,
      speed: 5,
      color: '#8b4513',
      emoji: '🦌',
      voice: 'ここはお前の来る場所じゃない。引き返せ',
      bontanColor: '#5c2d0c'
    }
  },
  {
    id: 'katahara',
    name: '形原',
    kana: 'かたはら',
    line: '名鉄蒲郡線',
    distanceFromPrev: 1.2,
    enemy: {
      name: '片原 大輔',
      title: '形原をまとめる男',
      hp: 60,
      atk: 8,
      speed: 6,
      color: '#ff7f00',
      emoji: '🍊',
      voice: '悪いことは言わない、今すぐ帰れ',
      bontanColor: '#cc5e00'
    }
  },
  {
    id: 'nishiura',
    name: '西浦',
    kana: 'にしうら',
    line: '名鉄蒲郡線',
    distanceFromPrev: 1.6,
    enemy: {
      name: '湯浅 治',
      title: '西浦温泉の用心棒',
      hp: 65,
      atk: 9,
      speed: 5,
      color: '#e0989c',
      emoji: '♨️',
      voice: 'のぼせる前に帰った方がいいぞ',
      bontanColor: '#a55e62'
    }
  },
  {
    id: 'kodomonokuni',
    name: 'こどもの国',
    kana: 'こどものくに',
    line: '名鉄蒲郡線',
    distanceFromPrev: 1.9,
    enemy: {
      name: '鈴木 健児',
      title: 'この界隈の悪ガキ上がり',
      hp: 70,
      atk: 10,
      speed: 7,
      color: '#ffcc00',
      emoji: '🍭',
      voice: 'ガキの頃からここで暴れてんだ。なめるなよ',
      bontanColor: '#cc9900'
    }
  },
  {
    id: 'higashi-hazu',
    name: '東幡豆',
    kana: 'ひがしはず',
    line: '名鉄蒲郡線',
    distanceFromPrev: 2.3,
    enemy: {
      name: '富田 智明',
      title: '東幡豆の漁師あがり',
      hp: 75,
      atk: 11,
      speed: 6,
      color: '#4a7c8c',
      emoji: '🦪',
      voice: 'うちの海を荒らすなら容赦しない',
      bontanColor: '#2e5662'
    }
  },
  {
    id: 'nishi-hazu',
    name: '西幡豆',
    kana: 'にしはず',
    line: '名鉄蒲郡線',
    distanceFromPrev: 1.5,
    enemy: {
      name: '羽豆 竜也',
      title: '西幡豆の若頭',
      hp: 80,
      atk: 12,
      speed: 7,
      color: '#1e5f7a',
      emoji: '🎣',
      voice: 'ここから先は通さない。痛い目を見るぞ',
      bontanColor: '#0e3a4f'
    }
  },
  {
    id: 'mikawa-toba',
    name: '三河鳥羽',
    kana: 'みかわとば',
    line: '名鉄蒲郡線',
    distanceFromPrev: 3.2,
    enemy: {
      name: '鳥羽 修司',
      title: '火祭りの暴れ者',
      hp: 90,
      atk: 14,
      speed: 8,
      color: '#cc2222',
      emoji: '👹',
      voice: '火祭りで鍛えた体だ。本気でいく',
      bontanColor: '#7a1414'
    }
  },
  // ==== 乗換駅（中ボス） ====
  {
    id: 'kira-yoshida',
    name: '吉良吉田',
    kana: 'きらよしだ',
    line: '名鉄蒲郡線⇔西尾線',
    distanceFromPrev: 0,
    isMidBoss: true,
    enemy: {
      name: '吉良 雅樹',
      title: '吉良吉田を仕切る男',
      hp: 120,
      atk: 16,
      speed: 8,
      color: '#6a1b9a',
      emoji: '⚔️',
      voice: 'ここは俺の縄張りだ。よそ者は通さない',
      bontanColor: '#3d0c5c'
    }
  },
  // ==== 西尾線 ====
  {
    id: 'kami-yokosuka',
    name: '上横須賀',
    kana: 'かみよこすか',
    line: '名鉄西尾線',
    distanceFromPrev: 2.8,
    danger: 1,
    enemy: {
      name: '尾崎 清則',
      title: '上横須賀の番を張る男',
      hp: 130,
      atk: 22,
      speed: 10,
      color: '#1565c0',
      emoji: '🧥',
      voice: 'ここはうちの縄張りだ。タダじゃ通さない',
      bontanColor: '#0a3a7a'
    }
  },
  {
    id: 'fukuchi',
    name: '福地',
    kana: 'ふくち',
    line: '名鉄西尾線',
    distanceFromPrev: 2.0,
    enemy: {
      name: '福地 浩二',
      title: '福地を仕切る男',
      hp: 100,
      atk: 16,
      speed: 7,
      color: '#d4a017',
      emoji: '🎰',
      voice: '運が悪かったな。ここは通せない',
      bontanColor: '#9c750f'
    }
  },
  {
    id: 'nishio',
    name: '西尾',
    kana: 'にしお',
    line: '名鉄西尾線',
    distanceFromPrev: 2.3,
    isMidBoss: true,
    danger: 2,
    enemy: {
      name: '西野 怜司',
      title: '西尾を束ねる男',
      hp: 240,
      atk: 32,
      speed: 11,
      color: '#558b2f',
      emoji: '🍵',
      voice: '西尾までよく来たな。ここからは骨が折れるぞ',
      bontanColor: '#33561c'
    }
  },
  {
    id: 'nishio-guchi',
    name: '西尾口',
    kana: 'にしおぐち',
    line: '名鉄西尾線',
    distanceFromPrev: 0.7,
    enemy: {
      name: '江口 元太',
      title: '西尾を離れた一匹狼',
      hp: 105,
      atk: 17,
      speed: 8,
      color: '#37474f',
      emoji: '👄',
      voice: '西野の世話にはならねえ。俺は俺でやる',
      bontanColor: '#1c252b'
    }
  },
  {
    id: 'sakuramachi-mae',
    name: '桜町前',
    kana: 'さくらまちまえ',
    line: '名鉄西尾線',
    distanceFromPrev: 1.4,
    enemy: {
      name: '町田 修平',
      title: '桜町商店街の用心棒',
      hp: 110,
      atk: 18,
      speed: 8,
      color: '#e91e63',
      emoji: '🏪',
      voice: 'うちの店に手を出すな。それだけだ',
      bontanColor: '#9c0e3f'
    }
  },
  {
    id: 'yonezu',
    name: '米津',
    kana: 'よねづ',
    line: '名鉄西尾線',
    distanceFromPrev: 2.2,
    enemy: {
      name: '米田 剛',
      title: '米津をまとめる男',
      hp: 115,
      atk: 19,
      speed: 8,
      color: '#bdbdbd',
      emoji: '🍙',
      voice: 'ここは俺の地元だ。なめてもらっちゃ困る',
      bontanColor: '#757575'
    }
  },
  {
    id: 'minami-sakurai',
    name: '南桜井',
    kana: 'みなみさくらい',
    line: '名鉄西尾線',
    distanceFromPrev: 1.6,
    enemy: {
      name: '桜井 恭太',
      title: '南桜井の喧嘩屋',
      hp: 120,
      atk: 20,
      speed: 10,
      color: '#f8bbd0',
      emoji: '🌸',
      voice: 'やる気なら相手になる。後悔するなよ',
      bontanColor: '#c48b9e'
    }
  },
  {
    id: 'sakurai',
    name: '桜井',
    kana: 'さくらい',
    line: '名鉄西尾線',
    distanceFromPrev: 1.4,
    enemy: {
      name: '桜庭 蓮',
      title: '桜井の兄貴分',
      hp: 125,
      atk: 21,
      speed: 11,
      color: '#ec407a',
      emoji: '💋',
      voice: 'いい度胸だ。だが、ここは通せない',
      bontanColor: '#b0144f'
    }
  },
  {
    id: 'horiuchi-koen',
    name: '堀内公園',
    kana: 'ほりうちこうえん',
    line: '名鉄西尾線',
    distanceFromPrev: 1.1,
    enemy: {
      name: '堀内 茂',
      title: '堀内公園の主',
      hp: 140,
      atk: 22,
      speed: 6,
      color: '#5d4037',
      emoji: '🎠',
      voice: 'この公園は俺の場所だ。通りたきゃ倒してみろ',
      bontanColor: '#2e1f17',
      isBig: true
    }
  },
  {
    id: 'hekikai-furui',
    name: '碧海古井',
    kana: 'へきかいふるい',
    line: '名鉄西尾線',
    distanceFromPrev: 0.9,
    enemy: {
      name: '古谷 文夫',
      title: '碧海古井の古株',
      hp: 145,
      atk: 23,
      speed: 9,
      color: '#263238',
      emoji: '🕳️',
      voice: '長いことここを見てきた。新顔は通さない',
      bontanColor: '#101618'
    }
  },
  {
    id: 'minami-anjo',
    name: '南安城',
    kana: 'みなみあんじょう',
    line: '名鉄西尾線',
    distanceFromPrev: 1.1,
    enemy: {
      name: '安藤 隆',
      title: '南安城の番長',
      hp: 150,
      atk: 24,
      speed: 12,
      color: '#212121',
      emoji: '💈',
      voice: '身なりを乱されるのは好かん。やるか?',
      bontanColor: '#000'
    }
  },
  {
    id: 'kita-anjo',
    name: '北安城',
    kana: 'きたあんじょう',
    line: '名鉄西尾線',
    distanceFromPrev: 1.1,
    enemy: {
      name: '安城 信行',
      title: '北安城の参謀格',
      hp: 160,
      atk: 25,
      speed: 11,
      color: '#311b92',
      emoji: '🥋',
      voice: '無駄な争いはしたくない。だが退く気もない',
      bontanColor: '#1a0d52'
    }
  },
  // ==== ラスボス ====
  {
    id: 'shin-anjo',
    name: '新安城',
    kana: 'しんあんじょう',
    line: '名鉄西尾線',
    distanceFromPrev: 1.0,
    isFinalBoss: true,
    enemy: {
      name: '安生 譲二',
      title: '新安城の総長',
      hp: 250,
      atk: 30,
      speed: 13,
      color: '#b71c1c',
      emoji: '👑',
      voice: 'ここまで来たか。…なら、相手になろう',
      bontanColor: '#6e0f0f'
    }
  }
];

// プレイヤー初期ステータス
window.PLAYER_INIT = {
  name: 'ボンタン狩り太郎',
  hp: 100,
  maxHp: 100,
  atk: 10,
  speed: 8,
  bontans: [], // 集めたボンタンのenemy.name配列
  defeated: [], // 倒した駅のid配列
  money: 0,     // カツアゲ金（強化ショップの通貨）
  upgrades: {}, // 購入済み強化のレベル {hp, atk, meter}
  bestScores: {}, // 駅id → 自己ベストスコア
  dexClaims: {}, // ボンタン図鑑の収集マイルストーン受取済み
  achievements: {}, // 解除済み実績 id → true
  streak: 0,      // 連勝数（負けでリセット）
  bestStreak: 0,  // 最高連勝
  lastDaily: '',  // デイリーボーナス最終受取日(YYYY-MM-DD)
  ngPlus: 0       // 強くてニューゲーム+ の周回数
};

// 駅ID → キャラアーキタイプID
// アーキタイプは見た目（emoji/accessory）と戦闘AIパターンを決定する
window.STATION_ARCHETYPE = {
  // 蒲郡線
  'gamagori':           'yankee-basic',     // ガマゴリ若頭：基本パンチ・キック
  'gamagori-kyoutei':   'gambler-boss',     // 賭けマサ：イカサマ投げ
  'mikawa-kashima':     'yankee-basic',     // シカジマ
  'katahara':           'thrower-boss',     // カタハラ蜜柑：ミカン連投
  'nishiura':           'onsen-boss',       // 温泉のヌシ：湯気目つぶし
  'kodomonokuni':       'kid-boss',         // ガキ大将ケンジ
  'higashi-hazu':       'yankee-fisher',    // アサリのトミ
  'nishi-hazu':         'yankee-fisher',    // ハズの竜
  'mikawa-toba':        'yankee-fire',      // 鳥羽の鬼面
  // 乗換中ボス
  'kira-yoshida':       'samurai-yanki',
  // 西尾線
  'kami-yokosuka':      'yankee-basic',
  'fukuchi':            'gambler-boss',     // フク兄ィ：博打使い
  'nishio':             'skinhead',         // 西尾はスキンヘッド（入れ墨・青龍刀）固定（2026-06-12 hoshiさん指定）
  'nishio-guchi':       'yankee-basic',
  'sakuramachi-mae':    'thrower-boss',     // マチオ：シャッター叩き
  'yonezu':             'big-boss',         // 米兄ィ：米俵パワー
  'minami-sakurai':     'yankee-fire',      // キョータ：桜散らし
  'sakurai':            'girl-yankee',      // 花子姉さん
  'horiuchi-koen':      'big-boss',         // 公園のヌシ
  'hekikai-furui':      'yankee-basic',
  'minami-anjo':        'riezent-boss',     // タカシ：リーゼント
  'kita-anjo':          'karate-boss',      // ノブ兄：空手
  // ラスボス
  'shin-anjo':          'final-boss'
};

// 各駅の enemy にアーキタイプIDを自動付与
window.STATIONS.forEach(st => {
  st.enemy.archetypeId = window.STATION_ARCHETYPE[st.id] || 'yankee-basic';
  // レアエンカウント側にもアーキタイプ
  if (st.rareEnemy) {
    st.rareEnemy.archetypeId = 'yakuza';
  }
});
