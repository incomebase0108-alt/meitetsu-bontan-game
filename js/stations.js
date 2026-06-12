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
      name: 'ガマゴリ若頭',
      title: '蒲郡港の暴れガマ',
      hp: 40,
      atk: 5,
      speed: 3,
      color: '#2d5016',
      emoji: '🐸',
      voice: 'ガマガマ…許さねぇぞコラ',
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
      name: '賭けマサ',
      title: '万舟券を夢見る男',
      hp: 50,
      atk: 6,
      speed: 4,
      color: '#0066cc',
      emoji: '🚤',
      voice: '今日の予想は…テメェをボコる！',
      bontanColor: '#003d7a'
    },
    rareEnemy: {
      name: '蒲郡組組長・舟弾の蛇',
      title: '競艇場に潜む裏稼業',
      hp: 200,
      atk: 28,
      speed: 9,
      color: '#1a1a1a',
      emoji: '🐍',
      voice: '今日のシマ荒らしたな小僧…生きて帰れると思うなよ',
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
      name: 'シカジマ',
      title: '角持つ男',
      hp: 55,
      atk: 7,
      speed: 5,
      color: '#8b4513',
      emoji: '🦌',
      voice: 'この角でツノってやる！',
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
      name: 'カタハラ蜜柑',
      title: 'ミカン投げの達人',
      hp: 60,
      atk: 8,
      speed: 6,
      color: '#ff7f00',
      emoji: '🍊',
      voice: 'ミカンの皮ですべりやがれ！',
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
      name: '温泉のヌシ',
      title: '湯けむり用心棒',
      hp: 65,
      atk: 9,
      speed: 5,
      color: '#e0989c',
      emoji: '♨️',
      voice: 'のぼせさせてやるぜ…',
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
      name: 'ガキ大将ケンジ',
      title: '幼稚園からのワル',
      hp: 70,
      atk: 10,
      speed: 7,
      color: '#ffcc00',
      emoji: '🍭',
      voice: 'おにいちゃんごっこしようぜ！',
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
      name: 'アサリのトミ',
      title: '潮干狩りの番人',
      hp: 75,
      atk: 11,
      speed: 6,
      color: '#4a7c8c',
      emoji: '🦪',
      voice: 'うちの貝盗ったら…海に沈めるぞ',
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
      name: 'ハズの竜',
      title: '漁師町の若大将',
      hp: 80,
      atk: 12,
      speed: 7,
      color: '#1e5f7a',
      emoji: '🎣',
      voice: '釣り上げて干物にしてやらぁ！',
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
      name: '鳥羽の鬼面',
      title: '火祭りの暴れ者',
      hp: 90,
      atk: 14,
      speed: 8,
      color: '#cc2222',
      emoji: '👹',
      voice: '燃えてんのは俺の魂じゃボケ！',
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
      name: '吉良の若殿マサキ',
      title: '乗換駅の支配者',
      hp: 120,
      atk: 16,
      speed: 8,
      color: '#6a1b9a',
      emoji: '⚔️',
      voice: '我が領地で何の真似だ田舎モンが',
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
      name: '鉄火のジロー',
      title: '上横須賀の番を張る男',
      hp: 130,
      atk: 22,
      speed: 10,
      color: '#1565c0',
      emoji: '🧥',
      voice: 'ここはウチの縄張りや…授業料置いてけや',
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
      name: 'フク兄ィ',
      title: '福の神のフリした悪',
      hp: 100,
      atk: 16,
      speed: 7,
      color: '#d4a017',
      emoji: '🎰',
      voice: '福は内、テメェは外じゃ！',
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
      name: '抹茶の総番ミドリ',
      title: '西尾の闇を統べる茶坊主',
      hp: 240,
      atk: 32,
      speed: 11,
      color: '#558b2f',
      emoji: '🍵',
      voice: '抹茶より苦い思いさせたるわ…ようこそ西尾へ',
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
      name: '口卑のゲンタ',
      title: '抹茶嫌いの裏切り者',
      hp: 105,
      atk: 17,
      speed: 8,
      color: '#37474f',
      emoji: '👄',
      voice: '抹茶なんてクソ食らえじゃ！',
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
      name: 'マチオ',
      title: '商店街の用心棒',
      hp: 110,
      atk: 18,
      speed: 8,
      color: '#e91e63',
      emoji: '🏪',
      voice: 'うちのシャッターに落書きしたな！？',
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
      name: '米兄ィ',
      title: 'しゃもじの暴君',
      hp: 115,
      atk: 19,
      speed: 8,
      color: '#bdbdbd',
      emoji: '🍙',
      voice: 'うちの米を笑う奴は許さん！',
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
      name: 'キョータ',
      title: '南の桜散らし',
      hp: 120,
      atk: 20,
      speed: 10,
      color: '#f8bbd0',
      emoji: '🌸',
      voice: '桜と一緒に散らしてやんよ',
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
      name: '花子姉さん',
      title: '紅一点の女番長',
      hp: 125,
      atk: 21,
      speed: 11,
      color: '#ec407a',
      emoji: '💋',
      voice: 'ナメんじゃないわよ坊やぁ？',
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
      name: '公園のヌシ',
      title: '滑り台占拠の巨漢',
      hp: 140,
      atk: 22,
      speed: 6,
      color: '#5d4037',
      emoji: '🎠',
      voice: 'ベンチ譲らねぇ…座りたきゃ倒せ',
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
      name: '古井のフルヤ',
      title: '古井戸から這い出た男',
      hp: 145,
      atk: 23,
      speed: 9,
      color: '#263238',
      emoji: '🕳️',
      voice: '井戸の底に引きずり込むぞ…',
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
      name: 'タカシ',
      title: '南のリーゼント',
      hp: 150,
      atk: 24,
      speed: 12,
      color: '#212121',
      emoji: '💈',
      voice: 'リーゼント乱したら殺す！',
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
      name: 'ノブ兄',
      title: '北の参謀格',
      hp: 160,
      atk: 25,
      speed: 11,
      color: '#311b92',
      emoji: '🥋',
      voice: '我が拳、貴様には過ぎたるもの',
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
      name: '新安城総長アンジョー',
      title: '名鉄全線の頂点に立つ男',
      hp: 250,
      atk: 30,
      speed: 13,
      color: '#b71c1c',
      emoji: '👑',
      voice: 'ここまで来たか…散らしてやろう',
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
  defeated: [] // 倒した駅のid配列
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
