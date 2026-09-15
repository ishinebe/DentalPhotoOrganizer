# AGENTS.md

## Project

DentalPhotoOrganizer is a Windows desktop application that helps clinical staff sort mixed dental photographs by patient, review the provisional grouping, and export confirmed photographs safely to the clinic's normal storage folders.

This project handles medical photograph data. Safety, traceability, preservation of source images, and human review are more important than automation speed.

DentalPhotoOrganizer is not primarily a general-purpose dental image library. Its core problem is the upstream workflow: reducing the manual work required to separate large volumes of photographs by patient before formal storage.

## Read First

Before making any product, workflow, UI, or behavior change, read:

1. `README.md`
2. `docs/navigation.md`

Then follow the task-specific reading guide in `docs/navigation.md`.

For product-level or workflow-level decisions, also read:

- `docs/vision.md`
- `docs/principles.md`
- `docs/decisions.md`
- `docs/workflow.md`

## Primary Product Test

Before adding or expanding a feature, ask:

> Does this reduce the human work required to sort photographs by patient safely?

If not, the feature is not automatically a core requirement. Explain why it belongs in this product before expanding scope.

## Core Rules

1. Do not modify, delete, overwrite, or move original image files.
2. Do not bypass mandatory human photo review before export.
3. Do not treat automatic classification as final truth.
4. Do not treat high classification confidence as a reason to skip photo review.
5. The main review task is confirming that a provisional patient photo set contains only photographs from the same patient.
6. Keep the processing unit and final storage unit conceptually separate.
7. Patient photo sets are processing/review units; the target final storage unit is patient × shooting date.
8. Do not force photo type, laterality, doctor, photographer, or shooting-method metadata to become mandatory unless there is a clear workflow or safety reason.
9. Do not make the Search screen evolve into a full image-management product without an explicit product decision.
10. The official exported folder is the durable organized output; the database is primarily an index, state store, and audit source.
11. Do not confuse confirmation completion with export.
12. Do not confuse operation history with audit logs.
13. Do not remove traceability for review, correction, or export actions.
14. Do not rely on color alone to communicate critical states.
15. Do not change user-facing terminology without checking `docs/glossary.md`.
16. Do not guess product requirements when docs provide relevant guidance.
17. Do not make broad refactors when a small focused change is sufficient.

## Terminology Rules

Use the project glossary for user-facing labels and internal naming decisions.

Important user-facing terminology:

- Use 写真確認 instead of レビュー.
- Use 書き出し instead of エクスポート.
- Use 確認完了 instead of 承認.
- Use 取り込んだ写真 instead of 取込画像.
- Use 要整理写真 instead of 未所属写真.
- Use 書き出し対象外 for photos intentionally excluded from export.

Use 患者, この患者の写真, or 患者ごとの写真 when that is clearer in the UI. Use 患者写真セット when a precise internal/documentation concept is needed.

When unsure about terminology, read `docs/glossary.md` before editing.

## Workflow Rules

The intended workflow is:

1. Import photos.
2. Preserve original images.
3. Register imported photos as managed data.
4. Create provisional patient photo sets.
5. Use QR codes, barcodes, reception sheets, timestamps, file order, image characteristics, or future AI assistance as hints.
6. Treat grouping and automatic classification results as hypotheses.
7. Require human photo review.
8. Allow moving, splitting, and merging photographs before confirmation completion.
9. Export only confirmed data.
10. Organize final output primarily by patient × shooting date.
11. Use simple sequential output filenames rather than embedding mutable classification meaning in filenames.
12. Preserve operation history and audit logs.
13. Provide lightweight search for finding official export locations later.

## Data Safety Rules

- Original image files are source data and must be preserved.
- Import means registering photos as managed data, not modifying source files.
- Export writes organized output to an official export destination.
- Export must not alter original images.
- Thumbnails or previews must not alter original images.
- Existing exported files must not be deleted or overwritten silently.
- If a change could affect original image handling, inspect the relevant code carefully before editing.

## Human Oversight Rules

- Automatic classification is assistive only.
- Classification confidence is a guide for human attention, not a substitute for human review.
- Patient photo sets are not final until human photo review is completed.
- Confirmation completion means the user completed photo review; it is not export.
- Confirmed photo sets may still be corrected before export if an error is found.
- Export should allow users to return to photo review when an error is found.

## Metadata Rules

Patient ID and shooting date are core to the final sorting workflow.

The following may be useful metadata, but should not create unnecessary mandatory work unless policy requires it:

- attending doctor
- photographer
- shooting method
- photo type
- laterality
- classification confidence

Photo type and laterality should not be embedded in final filenames by default because they may be corrected later.

## Search Rules

Search is primarily an index to help users find organized data and open the recorded official export folder.

Do not assume that DentalPhotoOrganizer must provide:

- advanced longitudinal comparison
- annotation
- full photo-library browsing
- complex tagging
- general-purpose image editing

These should be separate product decisions if ever needed.

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
- Reduce cognitive load during repetitive patient-sorting and photo-review work.
- Make status and next actions visually obvious.
- Do not rely only on color to show critical state.
- Provide text, labels, icons, or layout cues in addition to color.
- Users should not need to remember important information across screens.
- When thumbnails are insufficient, users should be able to inspect larger images.
- If export is blocked, the reason should be visible.

## Implementation Rules

Before editing:

1. Identify the task category.
2. Read `docs/navigation.md`.
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
   - `npm run lint`
   - `npm run build`
3. Report changed files.
4. Report verification results.
5. Suggest a commit message.

## Database and Schema Rules

When changing database behavior:

1. Read `docs/navigation.md`.
2. Read `docs/glossary.md`.
3. Check existing schema and related data access code.
4. Preserve traceability fields where applicable.
5. Do not remove review, export, or audit-related fields without explicit instruction.
6. If schema changes are needed, provide the migration or SQL change clearly.

## Git Rules

- Keep commits focused.
- Use clear commit messages.
- Do not include local test output unless intentionally requested.
- Do not commit generated files or exported photo output unless intentionally requested.
- Treat patient photographs and export output as sensitive local data.
- Before suggesting a commit, summarize the changed files and verification commands.

## If Unsure

If the docs and code conflict:

1. Prefer safety, traceability, human review, and reduction of manual patient-sorting work.
2. Point out the conflict.
3. Propose the smallest safe change.
4. Do not silently choose a risky shortcut.
