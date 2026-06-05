# DentalPhotoOrganizer Phase 2-B

Electron + React + TypeScript による Windows デスクトップアプリの MVP 骨組みです。
Phase 2-A で Supabase 接続基盤を追加し、Phase 2-B で中核 DB スキーマを追加しています。

## 現在の実装範囲

- 左サイドバーの画面切替
- Dashboard のダミー集計カード
- Dashboard の Supabase 接続状態表示
- SDカード取込を想定した Import UI
- 患者グループ、サムネイル、メタデータ編集の 3 カラム Review UI
- ダミー検索条件を持つ Search UI
- 取込元、保存先、レビュー必須設定、アプリ情報の Settings UI
- `src/lib/supabase.ts` による Supabase クライアント初期化
- `supabase/schema.sql` による Supabase DB スキーマ定義

## supabase/schema.sql

`supabase/schema.sql` は、DentalPhotoOrganizer の MVP で使用する中核テーブル、制約、更新日時 trigger、検索用 index を作成するための SQL ファイルです。

作成されるテーブル:

- `photos`: 元画像ファイル単位の情報
- `photo_groups`: 患者単位・撮影単位の仮グループ
- `photo_group_items`: `photos` と `photo_groups` の中間テーブル
- `review_logs`: レビュー・承認・修正履歴の監査ログ

## Supabase SQL Editor での実行手順

1. Supabase の対象プロジェクトを開く
2. 左メニューから SQL Editor を開く
3. `supabase/schema.sql` の内容を貼り付ける
4. Run を実行する
5. Table Editor で `photos`, `photo_groups`, `photo_group_items`, `review_logs` が作成されたことを確認する

この SQL はローカル MVP 開発向けです。現時点では RLS は有効化していません。
本番運用前には、RLS・認証・権限設計を必ず行ってください。

## 未実装

- Supabase Storage
- 認証
- OCR
- AI分類
- 画像処理
- 実ファイル操作
- 画面からのDB書き込み
- 自動フォルダ作成

## 環境変数

`.env` を作成し、Supabase の Project URL と anon key を設定します。

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

値が未設定の場合、Dashboard の Supabase接続状態は「未設定」と表示されます。

## セットアップ

```bash
npm install
```

## 起動

```bash
npm run dev
```

Vite 開発サーバーが `http://localhost:5173` で起動し、Electron ウィンドウが開きます。

## 型チェック

```bash
npm run lint
```

## ビルド

```bash
npm run build
```
