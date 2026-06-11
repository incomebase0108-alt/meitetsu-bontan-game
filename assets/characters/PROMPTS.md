# キャラクター画像生成プロンプト集

## 概要

このゲームは **9種類のキャラクターアーキタイプ** で23駅をカバーする設計です。各アーキタイプ画像を1枚ずつ作成すれば、全駅プレイ可能になります。

### 生成手順
1. 下記のプロンプトを **Adobe Firefly / Microsoft Designer (Bing) / DALL-E** などに貼り付け
2. 縦長 (3:4 または 2:3 アスペクト比) で生成
3. **背景は透過 or 単色** が望ましい（背景なし指定推奨）
4. ダウンロードして `assets/characters/{archetypeId}.png` に保存
   - 例：`yankee-basic.png`, `final-boss.png`
5. 画像があれば自動でゲーム内に反映されます（無ければ絵文字フォールバック）

### 推奨設定（Adobe Firefly）
- Content Type: **Art** (または Photo)
- Style: 「アニメ調」or「日本のレトロゲーム風」or「ピクセルアート」
- Aspect Ratio: **Portrait (3:4)**
- Visual Intensity: 中

### 無料枠の節約Tips
- 1キャラ1回で確定させず、2-3回リテイク前提で計画
- 9キャラ×平均3回 = 27回 → 月25枚の無料枠だとちょい超え
- 1〜2キャラはMicrosoft Designer (Bing Image Creator) で生成して節約

---

## 1. yankee-basic（基本ヤンキー）★最重要・14駅で使用

**日本語プロンプト**:
> 1980年代日本の不良少年、リーゼントヘア、黒の長ラン特攻服、白い鉢巻き、サラシ、太いボンタンズボン、サンダル、怒った表情で拳を握る、全身、正面、白背景、アニメ調

**English Prompt**:
> Japanese 1980s yankee delinquent teen, slicked-back pompadour hair, black long student gakuran uniform, white headband, baggy bontan pants, sandals, angry expression with clenched fist, full body shot, front view, plain white background, anime style, retro 2D game character

---

## 2. yankee-fisher（漁師ヤンキー）2駅で使用

**日本語プロンプト**:
> 漁師町の不良、日焼けした肌、青いハチマキ、漁師の法被風の上着を改造した特攻服、ゴム長靴、釣り竿を肩に担ぐ、全身、正面、白背景、アニメ調

**English Prompt**:
> Japanese coastal town fisherman delinquent, tanned skin, blue headband, customized fisherman happi coat as gakuran uniform, rubber boots, fishing rod over shoulder, baggy bontan pants, full body, front view, plain white background, anime style

---

## 3. yankee-fire（火祭り鬼面ヤンキー）三河鳥羽のみ

**日本語プロンプト**:
> 火祭りの鬼の面をつけた不良少年、赤い特攻服、燃え盛る松明を持つ、髪の毛が逆立つ、赤いハチマキ、全身、正面、黒背景にオレンジの炎、アニメ調、和風妖怪風

**English Prompt**:
> Japanese fire festival yankee delinquent wearing a red oni demon mask, red gakuran uniform with flame embroidery, holding a burning torch, spiky hair, red headband, full body, front view, black background with orange flames, anime style, Japanese yokai vibe

---

## 4. kid-boss（ガキ大将）こどもの国のみ

**日本語プロンプト**:
> ガキ大将の小学生、坊主頭、半ズボン、白いランニング、鼻水を垂らした不敵な笑み、Yの字に伸ばした腕、両手を腰、メンコと駄菓子袋を持つ、全身、正面、白背景、アニメ調、昭和レトロ

**English Prompt**:
> Japanese elementary school boy delinquent boss, shaved head, white tank top, short shorts, cocky grin with snot trail, hands on hips, holding old menko cards and dagashi candy bag, full body, front view, plain white background, anime style, Showa era retro

---

## 5. samurai-yanki（武家ヤンキー / 中ボス1）吉良吉田

**日本語プロンプト**:
> 武家風の不良、紫の袴と特攻服を組み合わせた衣装、髪は侍髷、竹刀を持つ、家紋入り、鋭い目つき、全身、正面、和風背景、アニメ調、中ボス感

**English Prompt**:
> Samurai-style yankee delinquent boss, purple hakama combined with gakuran uniform, samurai topknot hair, holding a kendo bamboo sword (shinai), family crest, sharp piercing eyes, full body, front view, Japanese traditional background, anime style, mid-boss aura

---

## 6. matcha-boss（抹茶ヤンキー / 中ボス2）西尾

**日本語プロンプト**:
> 緑色の特攻服を着た不良総長、抹茶の茶碗を片手に、もう片方は拳、深緑色のリーゼント、抹茶葉の刺繍、和菓子をベルトに、全身、正面、抹茶畑背景、アニメ調、中ボス感

**English Prompt**:
> Yankee delinquent boss in deep green gakuran uniform with matcha tea leaf embroidery, holding a matcha tea bowl in one hand, dark green pompadour hair, wagashi sweets on belt, full body, front view, matcha tea field background, anime style, mid-boss aura

---

## 7. girl-yankee（女番長）桜井

**日本語プロンプト**:
> 女番長、長いセーラー服のスカート、改造セーラー服、赤い口紅、長い黒髪、目つきが鋭い、銀のチェーン、桜の花びらが舞う、全身、正面、白背景、アニメ調、80年代スケバン

**English Prompt**:
> Japanese female yankee gang leader (sukeban), long sailor school uniform with extended skirt, red lipstick, long black hair, fierce piercing eyes, silver chain accessory, cherry blossom petals falling, full body, front view, plain white background, anime style, 1980s sukeban delinquent

---

## 8. big-boss（巨漢系）堀内公園

**日本語プロンプト**:
> 巨漢の不良、横幅のある体格、はちきれそうな黒の特攻服、坊主頭、無精ヒゲ、太い腕組み、威圧的な表情、全身、正面、白背景、アニメ調、力士のような体型

**English Prompt**:
> Giant fat yankee delinquent, very wide and bulky physique, bursting black gakuran uniform, shaved head, stubble beard, thick crossed arms, intimidating expression, full body, front view, plain white background, anime style, sumo wrestler body type

---

## 9b. yakuza（ヤクザ組長 / レアエンカウント）蒲郡競艇場前

**日本語プロンプト**:
> 日本のヤクザ組長、白いダブルスーツ、サングラス、オールバックの髪、入墨が首元から覗く、金のチェーン、葉巻、威圧的な表情、全身、正面、競艇場の暗い背景、リアル寄りアニメ調、昭和の極道

**English Prompt**:
> Japanese yakuza gang boss, white double-breasted suit, dark sunglasses, slicked-back hair, traditional irezumi tattoo visible at neck, gold chain, smoking a cigar, intimidating expression, full body, front view, dim boat racing track background, semi-realistic anime style, Showa era yakuza

→ 保存先: `assets/characters/yakuza.png`

---

## 9. final-boss（最終ボス総長）★ラスボス・新安城

**日本語プロンプト**:
> 名鉄全線を支配する不良総長、金色の刺繍が入った真っ赤な特攻服、王冠、長いリーゼント、両手にチェーン、背景に稲妻、絶対王者のオーラ、全身、正面、ドラマチックな構図、アニメ調、ラスボス感、最強

**English Prompt**:
> Ultimate boss of all Japanese yankee gangs, crimson red gakuran uniform with gold thread embroidery dragon design, golden crown, towering pompadour hair, chains in both hands, lightning background, absolute ruler aura, full body, front view, dramatic composition, anime style, final boss vibe, most powerful

---

## ボーナス：プレイヤーキャラ（player）

**日本語プロンプト**:
> 主人公の不良少年、青の特攻服、白いリーゼント、決意の表情、拳を握る、ボンタン狩りハンター、全身、正面、白背景、アニメ調、ヒーロー感

**English Prompt**:
> Protagonist yankee delinquent hero, blue gakuran uniform, white pompadour hair, determined expression, clenched fist, "bontan hunter" theme, full body, front view, plain white background, anime style, hero protagonist vibe

→ 保存先: `assets/characters/player.png`

---

## 画像配置後のチェックリスト

- [ ] `assets/characters/yankee-basic.png`
- [ ] `assets/characters/yankee-fisher.png`
- [ ] `assets/characters/yankee-fire.png`
- [ ] `assets/characters/kid-boss.png`
- [ ] `assets/characters/samurai-yanki.png`
- [ ] `assets/characters/matcha-boss.png`
- [ ] `assets/characters/girl-yankee.png`
- [ ] `assets/characters/big-boss.png`
- [ ] `assets/characters/final-boss.png`
- [ ] `assets/characters/yakuza.png` ★レアエンカウント
- [ ] `assets/characters/player.png`（任意）

ファイル名は **そのままのID** にしてください。コードは自動でロードします。
