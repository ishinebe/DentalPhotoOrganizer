# AGENTS.md

## Project

DentalPhotoOrganizer is a Windows desktop application for organizing, reviewing, and exporting intraoral photographs.

This project handles medical photograph data. Safety, traceability, and human review are more important than automation speed.

## Read First

Before making any product, workflow, UI, or behavior change, read:

1. docs/navigation.md

Then follow the task-specific reading guide in that file.

If the task affects import, grouping, photo review, export, metadata, terminology, user roles, logs, or photo display, read the related files listed in docs/navigation.md before editing code.

## Core Rules

1. Do not modify, delete, overwrite, or move original image files.
2. Do not bypass mandatory human photo review before export.
3. Do not treat automatic classification as final truth.
4. Do not treat high classification confidence as a reason to skip photo review.
5. Do not confuse confirmation completion with export.
6. Do not confuse patient photo sets with patient folders.
7. Do not confuse operation history with audit logs.
8. Do not remove traceability for review, correction, or export actions.
9. Do not rely on color alone to communicate critical states.
10. Do not change user-facing terminology without checking docs/glossary.md.
11. Do not guess product requirements when docs provide relevant guidance.
12. Do not make broad refactors when a small focused change is sufficient.

## Terminology Rules

Use the project glossary for user-facing labels and internal naming decisions.

Important user-facing terminology:

- Use 患者写真セット instead of 撮影セット.
- Use 写真確認 instead of レビュー.
- Use 書き出し instead of エクスポート.
- Use 確認完了 instead of 承認.
- Use 取り込んだ写真 instead of 取込画像.
- Use 要整理写真 instead of 未所属写真.
- Use 書き出し対象外 for photos or photo sets intentionally excluded from export.
- Use 分類信頼度 rather than 判定精度 or 低信頼.

When unsure about terminology, read docs/glossary.md before editing.

## Workflow Rules

The intended workflow is:

1. Import photos.
2. Preserve original images.
3. Register imported photos as managed data.
4. Create candidate patient photo sets.
5. Use QR codes, barcodes, reception sheets, timestamps, file order, or future AI assistance as hints.
6. Treat grouping and automatic classification results as hypotheses.
7. Require human photo review.
8. Allow correction before confirmation completion.
9. Allow re-checking before final export.
10. Export only confirmed patient photo sets.
11. Preserve operation history and audit logs.

## Data Safety Rules

- Original image files are source data and must be preserved.
- Import means registering photos as managed data, not modifying source files.
- Export writes organized output to an export destination.
- Export must not alter original images.
- Thumbnails or previews must not alter original images.
- If a change could affect original image handling, inspect the relevant code carefully before editing.

## Human Oversight Rules

- Automatic classification is assistive only.
- Classification confidence is a guide for human attention, not a substitute for human review.
- Patient photo sets are not final until human photo review is completed.
- Confirmation completion means the user completed photo review; it is not export.
- Confirmed photo sets may still be corrected before export if an error is found.
- Export should allow users to return to photo review when an error is found.

## Logging and Traceability Rules

The following roles must not be confused:

- 担当医
- 撮影者
- ログインユーザー
- 写真確認者
- 書き出し実行者

Important actions should be traceable:

- photo import
- automatic classification or grouping
- photo review
- confirmation completion
- correction
- marking as excluded from export
- export execution

Operation history is user-facing or workflow-facing history.
Audit logs are stricter records for later verification.
Do not treat audit logs as debug logs.

## UI Rules

- The UI must be understandable to clinicians, dental hygienists, dental staff, and other non-developer users.
- Reduce cognitive load during repetitive photo review work.
- Make status and next actions visually obvious.
- Do not rely only on color to show critical state.
- Provide text, labels, icons, or layout cues in addition to color.
- Users should not need to remember important information across screens.
- When thumbnails are insufficient, users should be able to inspect larger images.
- If export is blocked, the reason should be visible.

## Implementation Rules

Before editing:

1. Identify the task category.
2. Read docs/navigation.md.
3. Read the task-specific documents listed there.
4. Inspect the existing code related to the task.
5. Explain the implementation plan.

During editing:

1. Make small, focused changes.
2. Preserve existing import-review-export behavior unless the task explicitly changes it.
3. Avoid unrelated refactoring.
4. Keep TypeScript types clear.
5. Keep Electron APIs exposed through preload.
6. Avoid direct renderer access to privileged Electron or filesystem APIs.

After editing:

1. Run the relevant checks when possible.
2. Prefer running:
   - npm run lint
   - npm run build
3. Report changed files.
4. Report verification results.
5. Suggest a commit message.

## Database and Schema Rules

When changing database behavior:

1. Read docs/navigation.md.
2. Read docs/glossary.md.
3. Check existing schema and related data access code.
4. Preserve traceability fields where applicable.
5. Do not remove review, export, or audit-related fields without explicit instruction.
6. If schema changes are needed, provide the migration or SQL change clearly.

## Git Rules

- Keep commits focused.
- Use clear commit messages.
- Do not include local test output unless intentionally requested.
- Do not commit generated files or exported photo output unless intentionally requested.
- Before suggesting a commit, summarize the changed files and verification commands.

## If Unsure

If the docs and code conflict:

1. Prefer safety, traceability, and human review.
2. Point out the conflict.
3. Propose the smallest safe change.
4. Do not silently choose a risky shortcut.
