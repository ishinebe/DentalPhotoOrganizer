# DentalPhotoOrganizer Workflow

This document describes the intended user workflow of DentalPhotoOrganizer.

The purpose of this workflow is to help AI coding agents understand how the software is used in a clinical setting, not only how the internal code is structured.

## Workflow Overview

DentalPhotoOrganizer supports the following workflow:

1. Import photographs from a local folder or storage device.
2. Preserve original image files without modification.
3. Register imported photographs as source data.
4. Group photographs into candidate photo sets.
5. Detect or estimate patient-related information when possible.
6. Mark uncertain or incomplete groups as requiring human review.
7. Let a human operator review each photo set.
8. Correct patient, doctor, operator, shooting method, or photo assignment information when needed.
9. Approve the photo set after review.
10. Re-check approved photo sets before export.
11. Export only after final human confirmation.
12. Preserve review and export history.
13. Search past patient photographs for later review, correction, export-related work, and longitudinal comparison.

## User Context

The expected users include clinicians, dental hygienists, dental staff, and other clinic members.

Users may not have software development knowledge.

The interface should support intuitive operation and should not require users to understand the internal database structure.

## Typical Use Case

A user imports intraoral photographs from a camera SD card or local folder.

The application registers the photographs and creates candidate groups based on available signals such as QR/barcode information, timestamps, file order, or future AI-assisted classification.

The user reviews each candidate photo set.

If the photo set contains photographs from the same patient and the metadata is correct, the user approves it.

If the photo set contains incorrect photographs or wrong metadata, the user corrects it before approval.

After review, the user moves to export.

Before export, the user can still check the photo set again and return to the review screen if correction is needed.

The application exports only reviewed and approved photo sets.

Later, the user may search by patient ID, shooting date, attending doctor, or photographer to find previously imported patient photographs and reopen them for photo review.

If the patient photographs have already been exported, the user may primarily want to find the exported folder or file location rather than return to the review workflow.

Search also supports reviewing the same patient's photographs across different shooting dates so that longitudinal clinical changes can be found more easily.

## Import Workflow

During import:

- The user selects a source folder.
- The application reads image files from the selected source.
- The application calculates file metadata such as file name, file path, timestamp, and hash.
- Duplicate files are skipped or marked appropriately.
- Original files are not modified.
- Imported files are registered for later grouping and review.

Important rules:

- Import must not delete original files.
- Import must not overwrite original files.
- Import must preserve enough metadata for later verification.

## Grouping Workflow

During grouping:

- The application creates candidate photo sets.
- QR code or barcode information may be used when available.
- Timestamp and file order may be used to estimate group boundaries.
- AI-assisted classification may be used in the future.
- Grouping results are treated as hypotheses, not final truth.

Important rules:

- Uncertain grouping results must be sent to human review.
- AI or automatic grouping must not bypass human approval.
- A photo may require reassignment if it is placed in the wrong group.

## Review Workflow

During review:

- The user checks whether each photo set belongs to the same patient.
- The user checks patient ID and related metadata.
- The user checks attending doctor and operator information.
- The user selects or verifies the shooting method.
- The user checks and corrects photo type labels for individual photographs.
- The user checks the photo standard check panel for missing required photo types, unclassified photos, and photos labeled as その他.
- The user checks whether photographs are mixed with another patient’s photographs.
- The user corrects errors before approval.
- The user approves the photo set only after visual confirmation.

Important rules:

- Human review is mandatory before export.
- The review screen must make the current review status clear.
- The user must be able to correct mistakes intuitively.
- The user should not need to remember information across screens.
- The interface should reduce cognitive load and decision fatigue.
- Shooting method checks are assistive and must not replace human confirmation.

## Shooting Method and Photo Standard Check

The user-facing term is 「撮影方法」.

The internal code and database field currently use `photo_protocol`.

The patient information / photo review screen currently supports:

- 5枚法
- 9枚法
- 14枚法
- 部分撮影
- その他

5枚法, 9枚法, and 14枚法 have implemented required-photo checks.

14枚法 uses the formal required clinical photo type definition in docs/shooting-method.md.

部分撮影 and その他 do not perform missing-photo checks.

The photo standard check should show:

- Whether required photo types for the selected shooting method may be missing.
- Whether unclassified photos remain.
- Whether photos labeled as その他 are present.

The check is a review aid. It should guide the user to inspect the patient photographs, not automatically confirm or reject the group.

For implementation details, read `docs/shooting-method.md`.

## Search Workflow

Search is used to find patient photographs after import, review, or export.

The main search purpose is not to expose every internal status field. It is to help users quickly identify the patient photographs they are looking for.

Search should be treated as a patient photo library, not only as a list of unprocessed or unexported photo sets.

Exported patient photo sets are often especially valuable because they represent photographs that have already passed review and have been used in the official output workflow.

Search should support finding exported photo sets and opening the recorded official export folder when available.

Search should also support finding the same patient across multiple shooting dates so that longitudinal clinical changes can be reviewed.

Primary search axes:

- Patient ID.
- Shooting date range.
- Attending doctor.
- Photographer.
- Review status.
- Export status.

Recommended display target filters:

- All.
- Unreviewed.
- Reviewed.
- Unexported.
- Exported.

Search results should be patient-photo-set oriented rather than single-photo oriented unless the task explicitly requires photo-level search.

Search result cards should help visual identification. Small thumbnail previews are often more useful than additional filter fields for confirming whether the result is the patient photographs the user wants.

When multiple photo sets share the same patient ID, the UI should make shooting dates easy to compare, preferably in chronological or reverse-chronological order.

Recommended search result content:

- Patient ID.
- Shooting date.
- Photo count.
- Attending doctor.
- Photographer.
- Shooting method when available.
- Review status.
- Export status.
- A small row of representative thumbnails when available.

Search result actions should reflect the user's likely intent.

For unconfirmed or editable patient photographs, reopening photo review is the primary action.

For already exported patient photographs, opening or locating the exported folder may be the primary action, while photo review should remain available as a secondary correction path.

Important rules:

- Search should read DB metadata and preview data only.
- Search must not modify original image files.
- Search must not bypass photo review.
- Exported patients should still be searchable.
- Search results should allow users to reopen the patient photographs in photo review.
- Search results should support opening the recorded exported folder when `official_export_folder_path` is known.
- Do not infer or guess an exported folder path from naming rules alone.
- Only show an open-folder action when a recorded export destination is available.
- Keep search filters focused on the fields users naturally remember.
- Prefer visual confirmation in result cards over adding many rarely used filters.
- When showing multiple records for the same patient, make the shooting date prominent so users can compare changes over time.

## Export Workflow

During export:

- The user selects approved photo sets for export.
- The user can preview the selected photo set before final export.
- The user can return to review if an error is found.
- The application exports only reviewed and approved photo sets.
- Export history is recorded.

Important rules:

- Export must not occur for unreviewed photo sets.
- Export must not modify original image files.
- Export should make success and failure states obvious.
- Export should leave enough information for later verification.
- Export should record enough destination information to support later search, verification, and opening of exported folders.

## Post-export Correction and Additional Export

An exported photo set may still require later correction or addition.

Examples:

- A photograph initially excluded from export becomes necessary later.
- A photograph is reclassified after export.
- A photograph is moved back to a patient after export.
- A patient folder needs an additional photograph after the first export.

Important rules:

- Exported should mean exported at least once, not permanently locked.
- Users should be able to re-check exported patients in future workflows.
- Additional export must avoid destructive changes to existing exported folders.
- Existing exported files should not be deleted or overwritten silently.
- A future per-photo export target flag may allow users to include or exclude individual photographs from export.
- Photographs excluded from export should remain available for later inclusion.
- Reopening photo review for exported patients is a correction path, not always the primary search action.
- If an exported folder is available, search should help the user locate it without requiring unnecessary review steps.

## Error and Uncertainty Handling

When the system is uncertain:

- It should clearly show that human confirmation is required.
- It should avoid presenting uncertain results as final.
- It should explain what needs to be checked when possible.
- It should guide the user to the next appropriate action.

Examples:

- Missing patient ID.
- Multiple possible patient IDs.
- Low-confidence grouping.
- Possible mixed-patient photo set.
- Incomplete required metadata.
- Export blocked because review is incomplete.
- Missing required photo types for the selected shooting method.
- Unclassified photo types during review.

## Design Implications

The workflow implies the following design requirements:

- Review and export are separate but connected workflows.
- Users must be able to move from export back to review.
- Review status and export status should be visible.
- Patient ID, date, attending doctor, and operator should be searchable.
- Shooting method and photo type should be visible where they help human review.
- Search should function as a patient photo library that includes exported patient photo sets.
- Search should help users compare the same patient's photographs across shooting dates.
- Search should remain focused on memorable clinical metadata rather than exposing every internal status as a filter.
- Search results should support visual identification with small representative thumbnails when possible.
- Search result actions should prioritize likely user intent: review for correction, exported-folder access for locating already exported files.
- Export workflows should preserve destination information for later retrieval.
- The application should avoid unnecessary steps during repetitive review work.
- The system should support overnight automated processing followed by morning human review.
- Exported patients should remain available for later review, correction, or additional export workflows.
