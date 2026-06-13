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
8. Correct patient, doctor, operator, or photo assignment information when needed.
9. Approve the photo set after review.
10. Re-check approved photo sets before export.
11. Export only after final human confirmation.
12. Preserve review and export history.

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
- The user checks whether photographs are mixed with another patient’s photographs.
- The user corrects errors before approval.
- The user approves the photo set only after visual confirmation.

Important rules:

- Human review is mandatory before export.
- The review screen must make the current review status clear.
- The user must be able to correct mistakes intuitively.
- The user should not need to remember information across screens.
- The interface should reduce cognitive load and decision fatigue.

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

## Design Implications

The workflow implies the following design requirements:

- Review and export are separate but connected workflows.
- Users must be able to move from export back to review.
- Review status and export status should be visible.
- Patient ID, date, attending doctor, and operator should be searchable.
- The application should avoid unnecessary steps during repetitive review work.
- The system should support overnight automated processing followed by morning human review.
- Exported patients should remain available for later review, correction, or additional export workflows.
