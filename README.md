# DentalPhotoOrganizer Phase 2-D1

Electron + React + TypeScript による Windows デスクトップアプリの MVP 骨組みです。
Phase 2-D1 では Import 画面からローカル画像フォルダを選択し、画像ファイル本体は変更せず、メタデータのみを Supabase の `photos` テーブルへ登録できるようにしました。
Electron preload では `window.electronAPI.selectImageFolder()` を公開し、React 側はこの API 経由でのみフォルダ選択を実行します。

## 現在の実装範囲

- 左サイドバーの画面切替
- Dashboard の Supabase 実データ統計表示
- Dashboard の Supabase 接続状態表示
- Dashboard の読み込み中、取得成功、取得失敗、Supabase未設定の状態表示
- Dashboard の再読み込みボタン
- Import 画面のフォルダ選択
- Import 画面の Electron API 接続診断
- Import 画面の対象画像ファイル一覧表示
- Import 画面から `photos` テーブルへのメタデータ登録
- `file_hash` による重複スキップ
- 患者グループ、サムネイル、メタデータ編集の 3 カラム Review UI
- ダミー検索条件を持つ Search UI
- 取込元、保存先、レビュー必須設定、アプリ情報の Settings UI
- `src/lib/supabase.ts` による Supabase クライアント初期化
- `src/lib/photoStats.ts` による Dashboard 統計取得
- `src/lib/importPhotos.ts` による Import 登録処理
- `supabase/schema.sql` による Supabase DB スキーマ定義
- `supabase/seed.sql` による開発用シードデータ

## Import 画面

Import 画面では、Electron の main process 経由でローカルフォルダを選択します。
React 側から直接ファイルシステムを操作しません。
Electron ウィンドウ内では `window.electronAPI` が定義され、ブラウザ単体では未接続として表示されます。

対象拡張子:

- `.jpg`
- `.jpeg`
- `.png`

拡張子の大文字小文字は区別しません。

Electron 側で取得する情報:

- ファイル名
- フルパス
- ファイルサイズ
- MIME type
- SHA-256 `file_hash`

取込開始時は `photos` テーブルへ以下のメタデータのみ登録します。

- `original_filename`
- `original_path`
- `file_hash`
- `file_size`
- `mime_type`
- `imported_at`
- `review_status = 'pending'`
- `export_status = 'not_exported'`

元画像ファイルに対して以下は行いません。

- コピーしない
- 移動しない
- リネームしない
- 削除しない
- 画像加工しない

同じ `file_hash` がすでに `photos` に存在する場合は重複登録せず、取込結果で「重複スキップ」として集計します。

Supabase が未設定の場合、取込開始時に「Supabase未設定」と表示し、アプリはクラッシュしません。
現時点では Supabase Storage 連携は行いません。

Electron API が未接続の場合は「Electron API未接続」と表示し、フォルダ選択ボタンを無効化します。

## Dashboard 統計

Dashboard は `photos` テーブルから以下を取得します。

- 総画像数: `count(*)`
- レビュー待ち件数: `review_status = 'pending'`
- 本日の取込件数: `imported_at >= 今日の0:00`
- 承認済み件数: `review_status = 'approved'`

データが0件でも正常に表示されます。取得失敗時もアプリは停止せず、Dashboard にエラー状態を表示します。
Supabase の環境変数が未設定の場合は、Dashboard は「Supabase未設定」と表示し、統計値は0件として扱います。

## supabase/schema.sql

`supabase/schema.sql` は、DentalPhotoOrganizer の MVP で使用する中核テーブル、制約、更新日時 trigger、検索用 index を作成するための SQL ファイルです。

作成されるテーブル:

- `photos`: 元画像ファイル単位の情報
- `photo_groups`: 患者単位・撮影単位の仮グループ
- `photo_group_items`: `photos` と `photo_groups` の中間テーブル
- `review_logs`: レビュー・承認・修正履歴の監査ログ

## supabase/seed.sql

`supabase/seed.sql` は、Dashboard の実データ表示を確認するための開発用シードデータです。
`pending`、`approved`、今日の取込日、過去の取込日を含む複数の `photos` レコードを投入します。

実行手順:

1. Supabase の対象プロジェクトを開く
2. SQL Editor を開く
3. 先に `supabase/schema.sql` を実行する
4. 続けて `supabase/seed.sql` の内容を貼り付けて Run する
5. アプリを起動し、Dashboard の数値変化を確認する

## Supabase SQL Editor での schema.sql 実行手順

1. Supabase の対象プロジェクトを開く
2. 左メニューから SQL Editor を開く
3. `supabase/schema.sql` の内容を貼り付ける
4. Run を実行する
5. Table Editor で `photos`, `photo_groups`, `photo_group_items`, `review_logs` が作成されたことを確認する

この SQL はローカル MVP 開発向けです。現時点では RLS は有効化していません。
本番運用前には、RLS・認証・権限設計を必ず行ってください。

## 設計方針

- 元画像ファイルは不変
- 患者情報はDB管理
- 作業中ファイル名へ患者IDを埋め込まない
- AIは仮分類のみ
- 人間レビュー必須
- 承認後のみエクスポート
- 全画像を人間が確認
- 監査ログを保持

## 未実装

- Supabase Storage
- 画像コピー
- 画像移動
- 画像リネーム
- 画像削除
- 画像加工
- OCR
- AI分類
- 自動患者振り分け
- photo_groups作成
- Review画面の実データ化
- Search画面の実検索
- 認証
- RLS

## 環境変数

`.env` を作成し、Supabase の Project URL と anon key を設定します。

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

`.env` は Git 管理対象外です。共有用の雛形は `.env.example` を使用してください。

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
