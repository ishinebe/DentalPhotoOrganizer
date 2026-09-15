# DentalPhotoOrganizer Workflow

This document describes the intended clinical workflow of DentalPhotoOrganizer.

The purpose is to help maintainers and AI coding agents understand what problem the software is meant to solve, not merely how the current code is structured.

## Workflow Overview

DentalPhotoOrganizer supports the following target workflow:

1. Import photographs from an SD card, local folder, or similar source.
2. Preserve original image files without modification.
3. Register imported photographs as managed source data.
4. Create provisional patient photo sets using available signals.
5. Present those sets to a human reviewer.
6. Confirm that each set contains photographs from only one patient.
7. Correct mixed-patient cases by moving, splitting, or merging photographs when necessary.
8. Confirm patient ID and shooting date.
9. Record other metadata when useful without creating unnecessary mandatory work.
10. Export confirmed photographs safely to the clinic's official storage location.
11. Organize the final output primarily by patient × shooting date.
12. Record enough export information to find the official folder later.
13. Use Search as a lightweight index to locate organized patient data and open the official export folder.
14. Preserve review, correction, and export history.

## Core User Problem

The difficult manual task is not primarily viewing photographs after they have already been assigned correctly.

The difficult task is:

- importing large volumes of photographs,
- identifying patient boundaries,
- separating photographs by patient,
- finding mixed-patient errors,
- creating destination folders,
- and placing the photographs into the correct storage location.

The workflow should remove as much of that repetitive work as possible while keeping final patient assignment under human control.

## User Context

Expected users include clinicians, dental hygienists, residents, students, and clinical staff.

Users should not need software-development knowledge or knowledge of the internal database structure.

The interface should support repetitive sorting work with low cognitive load.

## Import Workflow

During import:

- The user selects a source folder or storage device.
- The application reads supported image files.
- The application records metadata such as path, filename, timestamps, file size, and hash.
- Duplicate files are skipped or identified appropriately.
- Original image files are not changed.
- Imported images become available for grouping and review.

Important rules:

- Import must not delete original files.
- Import must not overwrite original files.
- Import must not rename or move original files as part of routine processing.
- Import should preserve enough information for later verification.

## Provisional Patient Grouping

During provisional grouping:

- The application creates candidate patient photo sets.
- QR codes, barcodes, reception-sheet images, timestamps, file order, image characteristics, or future AI models may be used as hints.
- Grouping results are hypotheses, not final truth.
- Missing or unreadable QR/barcode information should not block the workflow completely.
- Suspicious boundaries should be surfaced for human attention.

Important rules:

- Automatic grouping must not finalize patient assignment without human review.
- Classification confidence is a prioritization signal only.
- A photo must be movable to another patient if grouping is wrong.
- A photo or group must be separable into a new patient when needed.
- Multiple provisional sets may later be recognized as belonging to the same patient.

## Photo Review Workflow

The main review task is:

> Confirm that the provisional patient photo set contains only photographs from the same patient.

During review, the user should be able to:

- inspect all photographs in the current patient photo set,
- verify or correct the patient ID,
- verify or correct the shooting date,
- move photographs to another existing patient,
- split photographs into a new patient,
- merge photographs that belong to the same patient,
- inspect warnings about suspicious boundaries or unexpected photo counts,
- save work temporarily,
- complete confirmation when the patient grouping is correct.

Important rules:

- Human review is mandatory before official export.
- The UI should prioritize photo confirmation over metadata form entry.
- Confirmation completion is not the same as export.
- Confirmed data may still be corrected before export if an error is found.

## Metadata During Review

Patient ID and shooting date are core to the target storage workflow.

The following may be useful but are secondary to patient sorting:

- attending doctor,
- photographer,
- shooting method,
- photo type,
- laterality,
- classification confidence.

These fields may be shown, stored, searched, or used for warnings when helpful.

However:

- they should not create unnecessary mandatory work,
- they should not prevent safe patient sorting merely because they are incomplete,
- and photo type or laterality should not be treated as immutable truth.

## Shooting Method and Photo Standard Check

The current application supports shooting-method metadata and photo-standard checks such as 5枚法, 9枚法, 14枚法, 部分撮影, and その他.

These functions are review aids.

They may help detect missing photographs, unexpected counts, or incomplete standard series.

They are not the primary product goal and must not replace the core same-patient confirmation task.

Implementation details remain documented in `docs/shooting-method.md`.

## Export Workflow

Before export:

- only confirmed patient data may proceed,
- the user may re-check the patient photographs,
- the user may return to photo review if an error is found,
- the application should clearly show the destination and relevant patient information.

During export:

- photographs are copied to the clinic's official export destination,
- original source images remain unchanged,
- destination collisions must be handled safely,
- export success or failure must be clear,
- export destination information must be recorded for later retrieval.

## Final Storage Model

The target final storage unit is **patient × shooting date**.

A patient photo set is an internal processing/review unit and does not have to map one-to-one to a permanent folder.

If multiple internal photo sets belong to the same patient on the same shooting date, they may be organized into the same official destination.

Conceptually:

```text
<official export root>/
  .../
    <patient + shooting date>/
      001.jpg
      002.jpg
      003.jpg
      ...
```

The exact upper-level hierarchy, such as year/month folders, may depend on the clinic's existing storage convention.

The important requirement is that the final folder clearly identifies the patient and shooting date and does not depend on internal database group IDs.

## Output Filename Model

Final filenames should use simple sequential numbering by default:

```text
001.jpg
002.jpg
003.jpg
...
```

The filename should not normally encode mutable interpretation such as:

- right/left,
- frontal/occlusal type,
- shooting method,
- AI classification result.

This keeps later correction simple and avoids misleading filenames when classification changes.

Additional export to an existing patient/date folder must avoid silent collisions or overwrites.

## Official Storage and Database Responsibility

The official clinic export folder is the durable organized output.

The database is primarily responsible for:

- patient assignment metadata,
- processing and review state,
- traceability,
- export history,
- recorded official export folder paths,
- search indexing.

The application should not require the database to remain available merely for a user to access already exported image files.

## Search Workflow

Search is a supporting function, not the main product.

Its primary purpose is to help users find organized patient data and reach the official export folder.

Useful search axes may include:

- patient ID,
- shooting date,
- attending doctor,
- photographer,
- review state,
- export state.

Patient ID and shooting date should remain the most important axes because they map directly to the core organization workflow.

For exported data, the primary action should usually be:

- open the recorded official export folder.

For unconfirmed or editable data, the primary action may be:

- open patient information / photo review.

Search should not automatically expand into:

- a full patient photo library,
- advanced longitudinal comparison,
- annotation,
- complex tag management,
- general-purpose image editing.

Those features require a separate product decision if they become necessary.

## Post-export Correction and Additional Export

Exported does not mean permanently locked.

A patient may later need:

- additional photographs,
- correction of grouping,
- reclassification,
- another official export.

Important rules:

- Existing exported files must not be silently deleted or overwritten.
- Additional export should be non-destructive.
- If new photographs are added to an existing patient/date destination, numbering must avoid collisions.
- A future correction workflow may update database metadata without requiring every already-exported file to be renamed.

## Error and Uncertainty Handling

When the system is uncertain:

- it should clearly show that human confirmation is required,
- it should avoid presenting uncertain results as final,
- it should explain what needs to be checked when possible,
- it should guide the user toward the next appropriate action.

When a feature proposal increases manual entry or workflow complexity, evaluate whether the added burden is justified by a clear safety, institutional, or operational benefit.
