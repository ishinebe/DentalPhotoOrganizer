# DentalPhotoOrganizer Navigation Guide

This document guides AI coding agents and future maintainers to the right project documents before making changes.

The purpose of this file is progressive disclosure:
do not read every document every time.
Instead, read the minimum necessary documents in the right order for the task.

## Always Read First

Before making any product or workflow change, read:

1. docs/vision.md
2. docs/principles.md
3. docs/decisions.md
4. docs/glossary.md

These files define the product purpose, non-negotiable principles, major decisions, and shared terminology.

## Product Context Documents

### docs/vision.md

Read this when:

- You need to understand why DentalPhotoOrganizer exists.
- You are making product-level or roadmap-level changes.
- You are deciding whether a feature fits the product.

Purpose:
Defines the product vision and the reasons this software exists.

### docs/principles.md

Read this when:

- You are changing behavior that may affect safety, usability, auditability, or data handling.
- You are changing import, review, or export behavior.
- You are considering shortcuts that may reduce human review or traceability.

Purpose:
Defines non-negotiable principles such as original image preservation, human oversight, auditability, usability, accessibility, and workflow compatibility.

### docs/decisions.md

Read this when:

- You are unsure why the current design exists.
- You are considering removing or bypassing an existing workflow.
- You are changing review, export, local-first storage, audit logs, or original image handling.

Purpose:
Records important product and architectural decisions and the reasons behind them.

### docs/workflow.md

Read this when:

- You are changing import, grouping, photo review, or export workflows.
- You are modifying screen transitions.
- You are changing how users move from photo review to export or back.
- You are changing how uncertain classification results are handled.

Purpose:
Explains how the software is used in a clinical workflow.

### docs/glossary.md

Read this when:

- You are adding or changing UI labels.
- You are naming variables, database fields, statuses, or functions.
- You are unsure about terms such as 患者写真セット, 写真確認, 書き出し, 要整理写真, 書き出し対象外, or 分類信頼度.

Purpose:
Defines project-specific terminology and prevents misunderstanding.

## Task-Based Reading Guide

## If modifying import behavior

Read in this order:

1. docs/principles.md
2. docs/decisions.md
3. docs/workflow.md
4. docs/glossary.md

Important concepts:

- 原本画像
- 取り込んだ写真
- QRコード
- バーコード
- 受付表
- 自動分類
- 分類信頼度

Rules:

- Do not modify, delete, or overwrite original image files.
- Import means registering photos as managed data, not changing the source files.
- Missing QR codes, barcodes, or reception sheets must not stop the workflow completely.

## If modifying grouping or automatic classification

Read in this order:

1. docs/principles.md
2. docs/decisions.md
3. docs/workflow.md
4. docs/glossary.md

Important concepts:

- 患者写真セット
- 自動分類
- 分類信頼度
- 要整理写真
- 別患者混入
- 写真タイプ

Rules:

- Automatic classification is only an assistive function.
- Grouping results are hypotheses, not final truth.
- Human photo review is always required before export.
- Low classification confidence should guide human attention, not replace human judgment.

## If modifying photo review behavior

Read in this order:

1. docs/principles.md
2. docs/decisions.md
3. docs/workflow.md
4. docs/glossary.md

Important concepts:

- 写真確認
- 確認待ち
- 確認済み
- 要修正
- 確認完了
- 写真確認者
- 別患者混入

Rules:

- Photo review is mandatory before export.
- Confirmation completion is not the same as export.
- UI should use 確認完了 rather than 承認 for user-facing actions.
- Even confirmed photo sets may be corrected before export if an error is found.

## If modifying export behavior

Read in this order:

1. docs/principles.md
2. docs/decisions.md
3. docs/workflow.md
4. docs/glossary.md

Important concepts:

- 書き出し
- 書き出し済み
- 書き出し先
- 患者フォルダ
- 書き出し済みフォルダ
- 書き出し対象外
- 書き出し実行者

Rules:

- Only confirmed patient photo sets can be exported.
- Export must not modify original image files.
- Users must be able to re-check before final export.
- Users should be able to return from export to photo review if an error is found.
- Exported folders are output results, not original storage locations.

## If modifying user roles or logs

Read in this order:

1. docs/principles.md
2. docs/decisions.md
3. docs/glossary.md

Important concepts:

- ログインユーザー
- 写真確認者
- 書き出し実行者
- 担当医
- 撮影者
- 操作履歴
- 監査ログ

Rules:

- 担当医, 撮影者, 写真確認者, 書き出し実行者, and ログインユーザー are not necessarily the same person.
- Important operations must be traceable.
- Audit logs are not the same as debug logs.
- Review and export actions should be linked to the user who performed them.

## If modifying UI text or labels

Read in this order:

1. docs/glossary.md
2. docs/principles.md
3. docs/workflow.md

Rules:

- Use 患者写真セット instead of 撮影セット in user-facing UI.
- Use 写真確認 instead of レビュー in user-facing UI.
- Use 書き出し instead of エクスポート in user-facing UI.
- Use 確認完了 instead of 承認 in user-facing UI.
- Avoid terms listed under Avoid in docs/glossary.md.
- Do not rely on color alone to communicate important state.

## If modifying search or metadata behavior

Read in this order:

1. docs/workflow.md
2. docs/glossary.md
3. docs/principles.md

Important concepts:

- 患者ID
- 撮影日
- 担当医
- 撮影者
- 写真タイプ

Rules:

- Patient ID, shooting date, attending doctor, and photographer are important search axes.
- 撮影日 is not the same as import date, export date, review date, or file modified date.
- Patient ID should not be embedded into original image filenames.

## If modifying photo display or preview behavior

Read in this order:

1. docs/workflow.md
2. docs/glossary.md
3. docs/principles.md

Important concepts:

- サムネイル
- 原本画像
- 取り込んだ写真
- 写真確認
- 書き出し前確認

Rules:

- Thumbnails are not original images.
- Thumbnail generation or display must not modify original image files.
- Users should be able to inspect larger images when thumbnails are insufficient.
- Photo display should reduce cognitive load during repetitive review work.

## Non-Negotiable Rules

The following rules must not be violated:

1. Do not modify, delete, or overwrite original image files.
2. Do not bypass human photo review before export.
3. Do not treat automatic classification as final truth.
4. Do not treat high classification confidence as a reason to skip photo review.
5. Do not confuse confirmation completion with export.
6. Do not confuse patient photo sets with patient folders.
7. Do not confuse operation history with audit logs.
8. Do not rely on color alone to show critical states.
9. Do not remove traceability for review, correction, or export actions.
10. Do not change user-facing terminology without checking docs/glossary.md.

## Recommended Agent Workflow

When asked to make a change:

1. Identify the task category.
2. Read the relevant documents listed above.
3. Inspect the existing code related to the task.
4. Explain the implementation plan before editing.
5. Make a small, focused change.
6. Run type check, lint, or build commands when applicable.
7. Report changed files and verification results.
8. Suggest a commit message.
