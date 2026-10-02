# ポチハテ

買うか迷ったら、ポチる前に数字で考えるアプリ。
欲しいものと価格を入れて8つの質問に答えると、100点満点の「購入理由スコア」と一言コメントが出ます。決めきれなければ30日後にもう一度判定できます。

- **判定する**（下のまんなかの ＋）：商品名と価格を入れて、8問に答える（0〜10の目盛り、または回数・金額・月数）
- **結果**：値札に点数、レシート風の内訳（項目ごとの点、元が取れるまで、貯金に対する割合、3万円以上なら1回あたりのコスト、自己満の減点）
- **30日**：残り日数のバー。30日たつと「もう一回判定する」が出て、前回の回答を直しながら再判定 → 「前回72点 → 今回58点」
- **履歴**：判定ごとに日付つきで月別に残る。タップで内訳。判定回数・平均点・買った合計・見送って守った金額
- **しくみ**：点数の決め方（項目・重み・判定の区切り）
- **マイページ**：今の貯金を一度入れておくと毎回の判定に使われる。1回あたりのコストを「3万円以上のとき／いつも／出さない」から選べる

技術：Next.js 15（App Router）・TypeScript・Tailwind CSS v4・shadcn/ui（Button / Card / Badge）・Motion → **Vercel**
データ：ブラウザの localStorage（端末ごとに保存。ログインなし）

## 現在の構成

| 項目 | 内容 |
|---|---|
| GitHub | `koharu-arai/pochihate`(非公開) |
| 公開 | Vercel(GitHub に push すると自動で更新) |
| サーバーの場所 | `vercel.json` で東京(`hnd1`) |
| 環境変数 | なし |
| ビルドチェック | `.github/workflows/build-check.yml`(push のたびに型チェックとビルド) |
| iPhone | Safari で公開URL → 共有 → **ホーム画面に追加**(`src/app/manifest.ts`・`public/icon-*.png`) |

---

## 1. まず動かす

**いちばん簡単な方法（Windows）**：エクスプローラーで pochihate フォルダを開き、`start.bat` をダブルクリック。
初回は必要な部品を入れてから起動します（1〜3分）。黒い画面が開いたままの間、http://localhost:3000 で使えます。止めるときは黒い画面を閉じます。
うまくいかないときは、同じフォルダの `setup-log.txt`（準備の記録）と `dev-log.txt`（起動中の記録）を見てください。

**コマンドで動かす場合**（Node.js 20 以上）

```bash
cd pochihate
npm install
npm run dev
```

> 型のチェックだけしたいとき：`npm run typecheck`
> 本番と同じビルドを試すとき：`npm run build`

## 2. 公開する（GitHub → Vercel）

1. https://vercel.com → **Add New… → Project** → GitHub の `pochihate` を **Import**
2. 設定はそのままで **Deploy**(環境変数は不要)
3. できた URL(`https://pochihate-xxx.vercel.app`)を iPhone の Safari で開く → 共有 → **ホーム画面に追加**

以後は GitHub に push するたびに自動で更新されます。

## 3. 同じWi-FiのiPhoneで試す（公開前）

`start-iphone.bat` をダブルクリック → 黒い画面(と `iphone-address.txt`)に出る `http://192.168.x.x:3002` を iPhone の Safari で開く。

---

## スコアの決め方（`src/lib/scoring.ts`）

| 項目 | 入力 | 100点に直し方 | 重み |
|---|---|---|---|
| 欲しい度 | 0〜10 | ×10 | 10 |
| 必要度 | 0〜10 | ×10 | 20 |
| 代用できなさ | 0〜10 | ×10 | 15 |
| 使用頻度 | 回/週 | 月1=20、週1=50、週3=75、毎日=100 | 15 |
| 元の取りやすさ | 1回いくら助かるか × 頻度 → 元が取れる月数 | 1ヶ月=100、6ヶ月=75、1年=55、2年=35。使う期間内に元が取れなければ最大25 | 20 |
| 貯金への負担の軽さ | 価格 ÷ 貯金 | 5%以下=100、10%=85、20%=65、30%=45、50%=20、100%=0 | 20 |

- 加重平均から **自己満度（新しいから・気分がいいから）× 0.8** を引く（最大 −8点）
- 価格が貯金を超えるときは **最大59点**
- 貯金が未入力なら、その項目を外して平均
- 80点以上「買ってよし」／60〜79点「もう少し考える」／59点以下「見送り推奨」

重みや区切りは `WEIGHTS`・`VANITY_MAX`・`OVER_SAVINGS_CAP` と `calc()` の中の表を書き換えると変えられます。

## フォルダ構成

```
src/
  app/            画面（/ 判定、/list 30日、/history 履歴、/about しくみ、/settings マイページ）、manifest、アイコン
  components/     JudgeView・ListView・HistoryView・AboutView・SettingsView・BottomNav（下のメニュー）・PriceTag（値札）・Receipt（内訳）
  components/ui/  shadcn/ui の Button・Card・Badge
  lib/            scoring.ts（質問と点数計算）・store.tsx（localStorage 保存）・types.ts
```
