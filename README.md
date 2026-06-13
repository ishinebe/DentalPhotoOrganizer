# DentalPhotoOrganizer Phase 2-E

Electron + React + TypeScript による Windows デスクトップアプリの MVP 骨組みです。
Phase 2-D1 では Import 画面からローカル画像フォルダを選択し、画像ファイル本体は変更せず、メタデータのみを Supabase の `photos` テーブルへ登録できるようにしました。
Electron preload では `window.electronAPI.selectImageFolder()` を公開し、React 側はこの API 経由でのみフォルダ選択を実行します。
Phase 2-E では Review 画面を Supabase の `photos` テーブルに接続し、レビュー待ち写真の確認、メタデータ保存、承認更新を行える土台を追加しました。

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
- Supabase の `photos` 実データを表示する 3 カラム Review UI
- Review 画面の pending 写真一覧取得
- Review 画面のメタデータ保存
- Review 画面の承認処理
- ダミー検索条件を持つ Search UI
- 取込元、保存先、レビュー必須設定、アプリ情報の Settings UI
- `src/lib/supabase.ts` による Supabase クライアント初期化
- `src/lib/photoStats.ts` による Dashboard 統計取得
- `src/lib/importPhotos.ts` による Import 登録処理
- `src/lib/reviewPhotos.ts` による Review 取得・保存・承認処理
- `supabase/schema.sql` による Supabase DB スキーマ定義
- `supabase/seed.sql` による開発用シードデータ

## Review 画面

Review 画面は `photos` テーブルから `review_status = 'pending'` の写真を `imported_at` の新しい順で最大100件取得します。

左カラムにはレビュー待ちの撮影セット一覧を表示します。

- 撮影セット番号
- 患者ID候補
- 写真枚数
- QRあり / QRなし
- 要確認ラベル

中央カラムには選択中撮影セットの概要、選択中写真プレビュー、撮影セット内写真一覧を表示します。

- `original_filename`
- `original_path`
- `file_hash`
- `mime_type`
- `file_size`
- `imported_at`
- `review_status`
- `export_status`

ローカル画像プレビューは Electron preload 経由で読み取り専用表示します。元画像ファイルは移動・リネーム・削除しません。

右カラムでは以下のレビュー情報を編集できます。

- 患者ID
- 撮影日
- 担当医
- 撮影者
- メモ

保存時は `reviewed_at` に現在時刻を入れます。
承認時は `review_status = 'approved'`、`export_status = 'ready_for_export'`、`reviewed_at`、`approved_at` を更新します。

`original_filename`、`original_path`、`file_hash` は編集不可です。患者IDはファイル名へ埋め込みません。

現時点では監査ログ書き込みは実装していません。将来的に承認・修正履歴を `audit_logs` に保存する予定です。

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
- 画像移動
- 画像リネーム
- 画像削除
- 画像加工
- OCR
- AI分類
- 自動患者振り分け
- photo_groups作成
- photo_groups 自動作成
- Search画面の実検索
- audit_logs への書き込み
- zip出力
- クラウドアップロード
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

## Phase2-F Review verification

Use this command to verify the Review save and approval workflow against real Supabase data:

```bash
npm run verify:review
```

The script reads `.env` and requires both values to be set:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

What the script verifies:

- Inserts one development-only pending row into `photos`
- Updates `provisional_patient_id`
- Updates `doctor_name`
- Updates `photographer_name`
- Updates `notes`
- Confirms `reviewed_at` is set after save
- Approves the row
- Confirms `review_status = approved`
- Confirms `export_status = ready_for_export`
- Confirms `reviewed_at` and `approved_at` are set after approval
- Confirms the approved row is no longer returned as pending

The script does not copy, move, rename, delete, or process any local image file. It creates metadata only.

## Phase3-A Local image preview

Review can display a read-only preview for the selected `photos.original_path` local image.

Preview behavior:

- Renderer does not use `fs`
- Renderer does not reference local paths directly with `<img src="C:\\...">`
- Electron main process reads the file
- Preload exposes `window.electronAPI.loadImagePreview(filePath)`
- Supported formats are `jpg`, `jpeg`, and `png`
- The original image file is never copied, moved, renamed, deleted, or processed
- Missing paths, unsupported extensions, read failures, and missing Electron API are shown as UI states

This preview works only on the same PC where `original_path` points to an existing local file. Multi-device preview will require a future Storage or shared storage design.

## Phase3-B Group-based review workflow

Review now uses `photo_groups` and `photo_group_items` as the main review target instead of reviewing `photos` directly.

Group review behavior:

- Pending `photos` without `photo_group_items` are temporarily grouped as `1 photo = 1 group`
- Group list is loaded from `photo_groups`
- Group photo counts are calculated from `photo_group_items`
- Selecting a group loads its photos through `photo_group_items`
- Group metadata can be edited:
  - `patient_id`
  - `shooting_date`
  - `doctor_id`
  - `photographer_id`
- Since Phase5-A, `doctor_id` and `photographer_id` are selected from the `staff` table when available. The UI shows staff names and saves staff IDs.
- The group Review workflow does not use:
  - `doctor_name`
  - `photographer_name`
  - `group_label`
  - `updated_at`
- `photo_groups.notes` is not used because it is not confirmed in the real DB. Phase5-A memo text is saved to child `photos.notes`.
- `レビュー内容を保存` updates the selected group only
- `レビュー完了` updates the selected group and its photos to:
  - `review_status = approved`
  - `export_status = ready_for_export`
  - `reviewed_at = now`
  - `approved_at = now`
- Dashboard counts continue to reflect `photos`, so completing a group reduces pending photo count and increases approved photo count

This phase does not implement QR recognition, OCR, AI grouping, similarity detection, export, or Storage migration.

## Phase3-C Group review verification

Use this command to verify the group-based Review workflow against real Supabase data:

```bash
npm run verify:group-review
```

The script reads `.env` and requires:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Verification coverage:

- Inserts one development-only ungrouped pending photo
- Confirms the photo initially has no `photo_group_items`
- Creates a temporary `1 photo = 1 group` record using `photo_groups`
- Creates the matching `photo_group_items` row
- Confirms `photo_groups` pending fetch returns the group
- Confirms child `photos` load through `photo_group_items`
- Saves group metadata:
  - `patient_id`
  - `shooting_date`
  - `doctor_id`
  - `photographer_id`
  - `reviewed_at`
- Completes review and confirms the group becomes `approved / ready_for_export`
- Confirms child photos also become `approved / ready_for_export`
- Confirms pending photo count returns to the pre-test value after completion

The real database uses `patient_id`, `doctor_id`, and `photographer_id` for `photo_groups`. Do not use `provisional_patient_id`, `doctor_name`, `photographer_name`, `notes`, `group_label`, or `updated_at` on `photo_groups`.

## Phase3-C Manual group editing

Review supports manual correction of group membership without changing original image files.

Available operations:

- Move the selected photo to another existing group
- Split the selected photo into a new group
- Merge the selected group into another group

Implementation rules:

- Only `photo_group_items.photo_group_id` is updated for membership changes
- `photo_group_items.photo_id` remains unique
- `photos.original_path`, `photos.file_hash`, and image files are never copied, moved, renamed, deleted, or edited
- Empty groups are not shown in Review
- Merge keeps the target group's metadata

Manual verification in a configured Supabase environment:

1. Import a folder with multiple images
2. Open Review and select a group
3. Select one photo and move it to another group
4. Confirm the source and target group photo counts update after reload
5. Select one photo and split it into a new group
6. Confirm a new one-photo group appears
7. Merge one group into another group
8. Confirm the source group disappears from Review when it becomes empty
9. Confirm this duplicate membership query returns no rows:

```sql
select photo_id, count(*) as group_item_count
from photo_group_items
group by photo_id
having count(*) > 1;
```

## Phase4-A Intake form code detection

Import now scans supported local image files for QR codes before saving metadata to Supabase.

Implementation details:

- QR detection runs in Electron main process while reading the selected folder.
- Renderer does not use `fs` and does not modify local image files.
- Supported image formats are `jpg`, `jpeg`, and `png`.
- QR detection uses `jsqr`; PNG/JPEG decoding uses `pngjs` and `jpeg-js`.
- When a QR code is detected, Import saves:
  - `photos.code_type = qrcode`
  - `photos.code_text = detected raw text`
- When no QR code is detected, Import saves:
  - `photos.code_type = null`
  - `photos.code_text = null`
- Review photo details display `Code Type` and `Code Text`.

Before using this feature against Supabase, run this SQL in the Supabase SQL Editor:

```sql
-- supabase/phase4a_add_photo_code_columns.sql
alter table public.photos
  add column if not exists code_type text,
  add column if not exists code_text text;
```

Phase4-A only detects, stores, and displays code metadata. It does not automatically assign `patient_id`, create groups from QR values, run OCR, run AI classification, or change/export image files.

## Phase4-A QR boundary photo sets

Review now groups unassigned pending photos into shooting sets by QR boundaries. The current implementation prefers detected QR metadata (`photos.code_type = qrcode` with non-empty `photos.code_text`) and falls back to QR filenames for legacy test data.

Grouping rule:

- Sort pending photos by `original_filename` natural ascending order, then `imported_at`
- A filename containing `QR` starts a new shooting set
- `QR_PATIENT_0001` style filenames are parsed as a UI-only patient candidate
- The QR image itself is included in the shooting set
- Photos before the first QR image become one unclassified shooting set
- Already assigned `photo_group_items.photo_id` values are not regrouped by the automatic first-load process
- Approved photos are not changed by the regroup button

The current real `photo_groups` schema does not have a dedicated provisional patient id column. QR patient candidates are therefore displayed in the UI only. Before production use, add a clear provisional patient id column or a related metadata table if QR-derived candidates must be persisted on `photo_groups`.

The Review screen includes a development button:

```text
QR境界で撮影セット再作成
```

This button removes group memberships for pending photos, deletes empty pending groups, and recreates pending shooting sets from detected QR boundaries. Filename-based QR boundaries remain as a fallback. It never modifies image files or approved photos.

## Phase4-B review set list UI

The Review screen shooting set list now displays operational review signals for each pending set:

- Shooting set number
- Patient ID candidate from `photo_groups.patient_id`, QR `code_text`, or the QR filename-derived fallback candidate
- Photo count
- QRあり / QRなし
- Review status label
- 要確認 label
- Representative thumbnail

The 要確認 label is shown when any of these conditions are true:

- The set has no QR image
- The set has no patient ID candidate
- The set has only 1 photo
- The set has 10 or more photos

Representative thumbnail selection:

1. First non-QR image in the shooting set
2. First image if the set contains only QR images
3. Icon fallback if Electron image preview is unavailable or loading fails

Real environment verification:

1. Start the app with `.env` configured.
2. Open Review.
3. Confirm the left list shows patient candidates, QRあり / QRなし, photo count, status, 要確認, and thumbnails.
4. Confirm existing preview, review save, review completion, move, split, and merge operations still work.

If `.env` is not configured in the Codex environment, live Supabase verification can be skipped. The UI keeps the existing Supabase未設定 fallback.

Manual verification SQL:

```sql
select count(*) from photos;
select count(*) from photo_groups;
select count(*) from photo_group_items;
```

Duplicate membership check:

```sql
select photo_id, count(*) as count
from photo_group_items
group by photo_id
having count(*) > 1;
```

Shooting set size check:

```sql
select
  pgi.photo_group_id,
  count(*) as photo_count
from photo_group_items pgi
group by pgi.photo_group_id
order by photo_count desc;
```

## Group duplication prevention

Review auto-grouping must not create a new `photo_groups` row when the target `photo_id` already exists in `photo_group_items`.

Current rules:

- Import creates `photos` metadata only.
- Review creates temporary groups only for pending photos that have no `photo_group_items` row.
- Before creating a group, Review rechecks `photo_group_items` for the target `photo_id`.
- Review hides duplicate group memberships so the same photo is not shown multiple times.
- The intended local MVP relationship is one `photo_id` to one `photo_group_id`.

Check existing duplicate memberships before applying the unique constraint:

```sql
select photo_id, count(*) as group_item_count
from photo_group_items
group by photo_id
having count(*) > 1;
```

If duplicates exist, inspect them manually before deleting anything:

```sql
select *
from photo_group_items
where photo_id in (
  select photo_id
  from photo_group_items
  group by photo_id
  having count(*) > 1
)
order by photo_id, created_at;
```

This project does not include automatic cleanup SQL for existing duplicate groups. After manually resolving duplicates, this SQL can be applied in Supabase SQL Editor:

```sql
-- supabase/phase_group_item_photo_unique.sql
alter table public.photo_group_items
  add constraint photo_group_items_photo_id_unique unique (photo_id);
```

Check empty review groups:

```sql
select
  pg.id,
  pg.review_status,
  pg.created_at,
  count(pgi.photo_id) as photo_count
from public.photo_groups pg
left join public.photo_group_items pgi
  on pgi.photo_group_id = pg.id
group by pg.id, pg.review_status, pg.created_at
having count(pgi.photo_id) = 0
order by pg.created_at desc;
```

After manual confirmation, empty groups can be removed with:

```sql
delete from public.photo_groups pg
where not exists (
  select 1
  from public.photo_group_items pgi
  where pgi.photo_group_id = pg.id
);
```

## Database Reference

実装時のDBカラム参照は `docs/database_reference.md` を優先する。

存在しないカラムを推測で使用しないこと。
実DBスキーマとコードに差異がある場合は、実DBスキーマを優先する。

# AI Assistant Development Notes

This section is intended for AI coding assistants (ChatGPT, Gemini, Claude, Codex, etc.).

## Project Purpose

DentalPhotoOrganizer is a desktop application for organizing intraoral photographs in dental clinics.

The software assists humans with:

* Photo import
* QR-based grouping
* Review workflow
* Metadata management
* Export

The software does NOT make final decisions.

Human reviewers are always responsible for final approval.

---

## Current Architecture

Current implementation intentionally prioritizes simplicity.

Main files:

* src/App.tsx
* src/lib/importPhotos.ts
* src/lib/photoStats.ts
* src/lib/reviewGroups.ts
* src/lib/reviewPhotos.ts
* src/lib/supabase.ts
* src/styles.css

Most UI is currently implemented directly inside App.tsx.

There is currently NO:

* Redux
* Zustand
* Context-based global state
* Complex component hierarchy

Do not assume these structures exist.

---

## Review Workflow Philosophy

The review screen is not intended as a generic "review" system.

The user's actual task is:

"Confirm that no photographs from another patient are mixed into the automatically grouped photo set."

UI terminology should prioritize clinical usability over developer terminology.

Preferred wording:

* Review → 撮影セット確認
* Pending → 確認待ち
* Approved → 確認済み

Avoid exposing internal workflow terminology when possible.

---

## Image Handling Rules

Original image files must never be modified.

The application must not:

* Rename originals
* Delete originals
* Move originals
* Overwrite originals

All grouping and metadata management should be database-driven.

---

## Current Phase

Current phase: Phase 7-D0 - 撮影種別マスタ設計

Phase7-D0 centralizes photo type and photo protocol definitions for future 5-view, 9-view, 14-view, partial, and other shooting workflows:

* `src/lib/photoTypes.ts` is the source of truth for photo type labels, display order, categories, and selectable options.
* The supported photo protocols are `five_view`, `nine_view`, `fourteen_view`, `partial`, and `other`.
* `five_view` defines the current standard required types: `front`, `right_buccal`, `left_buccal`, `upper_occlusal`, and `lower_occlusal`.
* `nine_view` is defined as a protocol and currently reuses the five-view required types until the additional four clinic-specific labels are finalized.
* `fourteen_view` is defined as a selectable protocol placeholder; required photo types are intentionally left empty for a future phase.
* Existing Review completeness checks continue to behave as the five-view protocol.
* Review and Export thumbnail display order is unchanged from Phase7-C.

Phase7-C uses saved `photos.photo_type` values to make Review and pre-export checking easier:

* Review shows a `撮影種別チェック` panel in the selected shooting set overview.
* The standard required photo types are `front`, `right_buccal`, `left_buccal`, `upper_occlusal`, and `lower_occlusal`.
* `qr` and `other` are displayed as photo types but are not required by the standard completeness check.
* Review thumbnails are displayed in this order: QR, 正面観, 右側方面観, 左側方面観, 上顎咬合面観, 下顎咬合面観, その他, 未分類.
* Export pre-check thumbnails use the same display order.
* This phase does not change `photo_group_items.sort_order`, export copy behavior, or DB export status updates.

Real environment verification for Phase7-C:

1. Open Review and select a shooting set.
2. Confirm `撮影種別チェック` shows each standard type as present or missing.
3. Change a photo type dropdown and confirm the completeness check updates immediately.
4. Confirm Review thumbnails follow the standard display order.
5. Open Export and confirm the pre-export thumbnail order matches Review.

Phase7-B changes shooting set boundary detection to prefer actual QR detection metadata saved during Import:

* Review grouping treats a photo as a QR boundary when `photos.code_type = qrcode` and `photos.code_text` is not empty.
* Filename-based QR detection remains only as a fallback for legacy test data such as `QR_PATIENT_0001`.
* QR patient candidates are extracted from `code_text` first, including JSON payloads such as `{"patient_id":"0001"}`.
* Review QR badges, QRあり / QRなし, patient candidates, and 要確認 reasons use the same detected-QR-first rule.
* No Electron API changes are required for this phase.

Real environment verification for Phase7-B:

1. Import real QR images and confirm `photos.code_type = qrcode` and `photos.code_text` has a value.
2. Open Review and confirm QR-detected photos start shooting set boundaries.
3. Confirm QR-free photo runs still become a single unclassified shooting set when needed.
4. Confirm filename-based `QR_PATIENT_0001` test images still work as a fallback.
5. Confirm Review QR badges, patient ID candidates, and 要確認 reasons are consistent.

Phase7-A adds manual photo type labeling to the Review workflow:

* Review shows a photo type dropdown for each photo in the selected shooting set.
* The selected photo preview also shows the same photo type dropdown, synchronized with the thumbnail list.
* `レビュー内容を保存` saves patient metadata and photo type labels together.
* `問題なしで確定` also saves the latest patient metadata and photo type labels before approving the shooting set.
* Export preview shows saved photo type labels on thumbnails for final pre-export checking.

Apply `supabase/phase7_photo_type.sql` before using Phase7-A photo type persistence. In the Supabase SQL Editor UI, open `supabase/phase7_photo_type.sql`, paste the contents, and run it. The migration adds:

* `photos.photo_type`
* `photos.photo_type_confidence`
* `photos.photo_type_source`

Photo type save values:

| value | label |
|---|---|
| `unclassified` | 未分類 |
| `qr` | QR |
| `front` | 正面観 |
| `upper_occlusal` | 上顎咬合面観 |
| `lower_occlusal` | 下顎咬合面観 |
| `right_buccal` | 右側方面観 |
| `left_buccal` | 左側方面観 |
| `other` | その他 |

Manual edits save `photo_type_source = manual` and leave `photo_type_confidence = null`.

Real environment verification for Phase7-A:

1. Apply `supabase/phase7_photo_type.sql`.
2. Open Review and select a pending shooting set.
3. Change photo type labels in the thumbnail list and selected photo preview.
4. Click `レビュー内容を保存`.
5. Confirm `photos.photo_type` and `photos.photo_type_source = manual` in Supabase.
6. Change labels again and click `問題なしで確定`.
7. Confirm the latest labels are saved while the shooting set becomes `approved`.
8. Open Export and confirm thumbnails display the saved photo type labels.

Phase6-B makes the Review confirmation workflow safer:

* `問題なしで確定` now saves the current review form before approving the shooting set.
* Review can switch between `確認待ち` and `確認済み`.
* Approved shooting sets can be returned to pending when they have not been exported.
* Exported shooting sets are visible in the approved list, but cannot be returned to pending in this phase.

When returning a shooting set to pending, the app uses the current schema's unexported state:

```text
review_status = pending
export_status = not_exported
approved_at = null
```

Phase6-A also added a local export workflow for reviewed shooting sets.

対象は `photo_groups.review_status = approved` and `photo_groups.export_status = ready_for_export` の撮影セットのみです。関連写真は `photo_group_items.photo_group_id` and `photos` から取得します。

Export rules:

* 元画像ファイルは変更しない
* 元画像ファイルを移動・削除・リネームしない
* Electron main process の `fs.copyFile` によるコピーのみ行う
* 出力先フォルダがなければ作成する
* 既存ファイルは上書きせず、`001_1.jpg` のように重複回避する

Output folder structure:

```text
selected export folder/
└─ YYYY-MM-DD/
   └─ patient_id/
      ├─ 001.jpg
      ├─ 002.jpg
      └─ 003.jpg
```

After all photos in a shooting set are copied successfully, the app updates:

* `photo_groups.export_status = exported`
* related `photos.export_status = exported`

If any photo fails, that shooting set remains `ready_for_export` so it can be retried.

Phase6-A Fix:

Electron runtime loads `dist-electron/preload.js`, which is generated by `scripts/write-preload.cjs` during `npm run build:electron`. When adding preload APIs, update both `electron/preload.ts` and `scripts/write-preload.cjs` so the generated preload exposes the same API names.

Real environment verification:

1. Configure `.env` with Supabase values.
2. Open Review.
3. Confirm `確認待ち` shows `review_status = pending` shooting sets.
4. Enter patient ID, shooting date, doctor, photographer, and memo.
5. Click `問題なしで確定` without first clicking `レビュー内容を保存`.
6. Confirm `photo_groups.patient_id`, `shooting_date`, `doctor_id`, `photographer_id`, `review_status = approved`, and `export_status = ready_for_export`.
7. Switch to `確認済み` and confirm the approved set is visible.
8. Click `確認待ちに戻す` on a non-exported set and confirm it returns to `review_status = pending` and `export_status = not_exported`.
9. Open Export and confirm Phase6-A export behavior still works.

---

## Approval Philosophy

AI only assists.

AI may:

* Suggest groups
* Detect possible issues
* Flag suspicious photos

AI may NOT:

* Automatically approve exports
* Make final patient assignments

Human reviewers remain responsible for final approval.

---

## Future Refactoring

The current App.tsx may eventually be split into components.

Before proposing large architectural changes, prioritize:

1. Maintaining workflow stability
2. Preserving review safety
3. Minimizing disruption to existing functionality
