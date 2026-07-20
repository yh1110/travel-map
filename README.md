# travel-map

場所を主語にした、地図が主役の絶景・穴場発見アプリ（MVP）。
コンセプトは [docs/concept.md](docs/concept.md) を参照。

## 構成

- **アプリ**: Expo (React Native) + TypeScript
- **地図**: [MapLibre React Native](https://github.com/maplibre/maplibre-react-native) + [OpenFreeMap](https://openfreemap.org)（API キー不要）
- **バックエンド**: Supabase（ローカル開発は Supabase CLI + Docker）

### 画面

| 画面 | 内容 |
|---|---|
| ホーム | 全画面マップ。投稿が「写真サムネイル + 撮影方向の扇形」ピンで表示される |
| 投稿 1/3 | 地図の十字中心で「撮った一点」を指定（現在地ボタンあり） |
| 投稿 2/3 | 北上固定の地図上で撮影方向（bearing）をスライダー / 端末コンパスで指定 |
| 投稿 3/3 | 写真選択（EXIF から撮影日時を取得）・タイトル入力・投稿 |
| スポット詳細 | 写真・撮影方向・撮影日時・ミニマップ（方向ピン付き） |

## セットアップ

### 1. 依存関係

```sh
npm install
```

### 2. ローカル Supabase（要 Docker）

```sh
npx supabase start
```

初回はイメージ取得に時間がかかる。起動時に migrations（spots テーブル・RLS・photos バケット）と seed（デモ投稿5件）が適用される。

### 3. 環境変数

```sh
cp .env.example .env
```

`npx supabase status` の出力から `API URL` と `anon key` を `.env` に設定する。

- シミュレータ: `http://127.0.0.1:54321` のままで OK
- 実機: `127.0.0.1` を Mac の LAN IP（例 `http://192.168.x.x:54321`）に置き換える

### 4. アプリ起動

MapLibre はネイティブモジュールのため **Expo Go では動かない**。dev build で起動する:

```sh
npx expo run:ios      # または run:android
```

## 開発コマンド

| コマンド | 内容 |
|---|---|
| `npm run typecheck` | TypeScript 型チェック |
| `npx supabase db reset` | ローカル DB をマイグレーション + seed で作り直す |
| `npx supabase stop` | ローカル Supabase 停止 |

## データモデル

`public.spots` — 「地図上の一点」が投稿の起点（後付けタグの構造的排除）:

| カラム | 説明 |
|---|---|
| `lat` / `lng` | 撮影地点（必須・投稿の第一ステップ） |
| `bearing` | 撮影方向（度、真北から時計回り 0-360） |
| `photo_path` | photos バケットのパス（seed は絶対 URL） |
| `taken_at` | 撮影日時（EXIF 由来、時間的臨場感） |

閲覧は誰でも（anon）、投稿は匿名認証ユーザー（開放型）。
