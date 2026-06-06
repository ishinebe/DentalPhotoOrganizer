# DentalPhotoOrganizer Database Reference

This document is the official database reference for implementation work.

## Source Of Truth

The Supabase production/development database schema is the source of truth.
Code must follow the real database, not assumptions from older local SQL files.

If this document, `supabase/schema.sql`, and code disagree, use this priority:

1. Real Supabase database schema
2. `docs/database_reference.md`
3. Application code
4. Legacy/local `supabase/schema.sql`

Important known mismatches:

- `photo_group_items` uses `photo_group_id`, not `group_id`.
- `photo_groups` uses `patient_id`, not `provisional_patient_id`.
- `photo_groups` uses `doctor_id`, not `doctor_name`.
- `photo_groups` uses `photographer_id`, not `photographer_name`.
- The current `supabase/schema.sql` is a legacy local MVP schema and does not fully match the real Supabase schema.
- `docs/db_schema.md` was not present when this reference was created.

Do not invent or guess column names in implementation. Confirm the real table shape first.

## photos

元画像ファイル単位のメタデータを管理する。
元画像はコピー・移動・リネームせず、`original_path` で参照する。

| column | type | nullable | default | note |
|---|---|---:|---|---|
| id | uuid | no | database generated | Primary key |
| original_filename | text | no | none | Original file name. 原則編集不可 |
| original_path | text | yes | none | Local file path. 原則編集不可 |
| file_hash | text | yes | none | Duplicate detection key. 原則編集不可 |
| file_size | bigint | yes | none | File size in bytes |
| mime_type | text | yes | none | `image/jpeg`, `image/png`, etc. |
| captured_at | timestamp with time zone | yes | none | Capture timestamp if known |
| imported_at | timestamp with time zone | yes | now | Import timestamp |
| import_batch_id | uuid | yes | none | Related import batch |
| provisional_patient_id | text | yes | none | Legacy/provisional patient identifier on photos |
| doctor_name | text | yes | none | Legacy/local MVP field. Prefer staff references in group workflow |
| photographer_name | text | yes | none | Legacy/local MVP field. Prefer staff references in group workflow |
| review_status | text | no | `pending` | Typical values: `pending`, `reviewing`, `approved`, `rejected` |
| export_status | text | no | `not_exported` | Typical values: `not_exported`, `ready_for_export`, `exported`, `export_failed` |
| reviewer_id | text | yes | none | Reviewer identifier in legacy schema |
| reviewed_at | timestamp with time zone | yes | none | Set when reviewed/saved |
| approved_at | timestamp with time zone | yes | none | Set when approved |
| notes | text | yes | none | Review notes |
| created_at | timestamp with time zone | yes | now | Creation timestamp |
| updated_at | timestamp with time zone | yes | now/trigger | Update timestamp |

Important notes:

- `original_filename`, `original_path`, and `file_hash` are immutable in normal app workflows.
- Do not put patient information into working file names.
- In group review, approval should update child `photos` status as well as `photo_groups`.

## photo_groups

患者候補または撮影単位の写真グループを管理する。
Review画面の主対象はこのテーブル。

Confirmed real Supabase columns:

| column | type | nullable | default | note |
|---|---|---:|---|---|
| id | uuid | no | database generated | Primary key |
| import_batch_id | uuid | yes | none | Related import batch |
| patient_id | text | yes | none | Patient identifier used by real DB |
| shooting_date | date | yes | none | Shooting date |
| doctor_id | uuid | yes | none | Staff reference for doctor |
| photographer_id | uuid | yes | none | Staff reference for photographer |
| confidence_score | numeric | yes | none | Future QR/AI grouping confidence |
| needs_review | boolean | yes | none | Whether human review is needed |
| review_status | text | yes | `pending` | Typical values: `pending`, `approved` |
| reviewer_id | uuid | yes | none | Staff/user who reviewed |
| reviewed_at | timestamp with time zone | yes | none | Set on review save/complete |
| approved_at | timestamp with time zone | yes | none | Set on review completion |
| export_status | text | yes | `not_exported` | Typical values: `not_exported`, `ready_for_export`, `exported`, `export_failed` |
| created_at | timestamp with time zone | yes | now | Creation timestamp |
| patient_uuid | uuid | yes | none | Patient UUID reference if available |

Important notes:

- Use `patient_id`; do not use `provisional_patient_id` for `photo_groups` unless the real DB adds it.
- Use `doctor_id`; do not use `doctor_name` for `photo_groups`.
- Use `photographer_id`; do not use `photographer_name` for `photo_groups`.
- `supabase/schema.sql` currently lists legacy columns (`group_label`, `provisional_patient_id`, `doctor_name`, `photographer_name`, `notes`, `updated_at`) that are not confirmed in the real DB.
- If notes are needed for group review, confirm whether real DB has `notes` or whether notes should be stored in `audit_logs`.

## photo_group_items

`photos` と `photo_groups` の中間テーブル。
写真がどのグループに属するか、並び順や分類補助情報を管理する。

Confirmed real Supabase columns:

| column | type | nullable | default | note |
|---|---|---:|---|---|
| id | uuid | no | database generated | Primary key |
| photo_group_id | uuid | no | none | References `photo_groups.id` |
| photo_id | uuid | no | none | References `photos.id` |
| sort_order | integer | yes | none | Display order in group |
| image_type | text | yes | none | Planned type such as front/left/right/upper/lower |
| confidence_score | numeric | yes | none | Classification/grouping confidence |
| outlier_score | numeric | yes | none | Outlier detection score |
| needs_review | boolean | yes | none | Whether this item needs human review |
| needs_review_reason | text | yes | none | Reason review is needed |
| created_at | timestamp with time zone | yes | now | Creation timestamp |

Important notes:

- Use `photo_group_id`; do not use `group_id`.
- Existing code must select/filter/insert with `photo_group_id`.
- This table is required even for temporary `1 photo = 1 group` grouping.

## import_batches

画像取込の単位を管理する。
Import画面や将来の監査・再実行・取込履歴確認で利用する。

Real columns were not provided in this task. Confirm in Supabase before implementation.

| column | type | nullable | default | note |
|---|---|---:|---|---|
| id | uuid | unknown | unknown | Expected primary key. Confirm in real DB |
| source_path | text | unknown | unknown | Expected import source path. Confirm in real DB |
| imported_at | timestamp with time zone | unknown | unknown | Expected import timestamp. Confirm in real DB |
| created_at | timestamp with time zone | unknown | unknown | Expected creation timestamp. Confirm in real DB |

Important notes:

- Do not add code against this table until real columns are confirmed.
- `photos.import_batch_id` may reference this table, but relationship details must be confirmed.

## patients

患者情報を管理する。
ファイル名ではなくDBで患者情報を扱う方針の中心テーブル。

Real columns were not provided in this task. Confirm in Supabase before implementation.

| column | type | nullable | default | note |
|---|---|---:|---|---|
| id | uuid | unknown | unknown | Expected primary key. Confirm in real DB |
| patient_id | text | unknown | unknown | Expected patient identifier. Confirm in real DB |
| created_at | timestamp with time zone | unknown | unknown | Expected creation timestamp. Confirm in real DB |

Important notes:

- `photo_groups.patient_id` and/or `photo_groups.patient_uuid` may relate to this table.
- Do not infer patient columns from UI labels.

## staff

担当医、撮影者、レビュアーなどのスタッフ情報を管理する。

Real columns were not provided in this task. Confirm in Supabase before implementation.

| column | type | nullable | default | note |
|---|---|---:|---|---|
| id | uuid | unknown | unknown | Expected primary key. Confirm in real DB |
| name | text | unknown | unknown | Expected staff display name. Confirm in real DB |
| role | text | unknown | unknown | Expected role such as doctor/photographer/reviewer. Confirm in real DB |
| created_at | timestamp with time zone | unknown | unknown | Expected creation timestamp. Confirm in real DB |

Important notes:

- `photo_groups.doctor_id`, `photo_groups.photographer_id`, and `photo_groups.reviewer_id` are UUID-style references.
- Do not use `doctor_name` or `photographer_name` for `photo_groups`.

## audit_logs

レビュー、承認、修正などの監査ログを保存する。

Real columns were not provided in this task. Confirm in Supabase before implementation.
This table replaces/extends the older local `review_logs` idea.

| column | type | nullable | default | note |
|---|---|---:|---|---|
| id | uuid | unknown | unknown | Expected primary key. Confirm in real DB |
| target_type | text | unknown | unknown | Expected target table/entity type. Confirm in real DB |
| target_id | uuid | unknown | unknown | Expected target row id. Confirm in real DB |
| action | text | unknown | unknown | Expected action name. Confirm in real DB |
| actor_id | uuid | unknown | unknown | Expected staff/user id. Confirm in real DB |
| before_data | jsonb | unknown | unknown | Expected snapshot before change. Confirm in real DB |
| after_data | jsonb | unknown | unknown | Expected snapshot after change. Confirm in real DB |
| created_at | timestamp with time zone | unknown | unknown | Expected creation timestamp. Confirm in real DB |

Important notes:

- Use `audit_logs`, not legacy `review_logs`, for future production audit design if real DB contains `audit_logs`.
- Do not write audit logs until the real column set is confirmed.
