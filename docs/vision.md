# DentalPhotoOrganizer Vision

DentalPhotoOrganizer exists to reduce the manual work required to sort large numbers of dental clinical photographs by patient before those photographs are placed in the clinic's normal storage folders.

The software is best understood as a **preprocessing and safety-confirmation layer**, not as a replacement for a full dental image-management system.

## Core problem

In the current workflow, photographs from multiple patients may be stored together on an SD card or local folder. A staff member later has to identify patient boundaries, separate photographs by patient, correct mixed-patient cases, create destination folders, and move the photographs into the correct storage location.

This repetitive sorting work is the main problem the product should solve.

## Primary success criterion

The most important product question is:

> Does this feature reduce the human work required to sort photographs by patient safely?

A feature that does not materially improve that workflow should not automatically become a core requirement.

## Product goals

- Reduce manual patient-by-patient sorting work.
- Reduce mixed-patient assignment errors.
- Preserve original image files safely.
- Make patient-boundary uncertainty visible instead of silently guessing.
- Support fast human confirmation and correction.
- Export confirmed photographs safely to the clinic's normal storage structure.
- Prevent accidental overwrites and folder/file collisions.
- Preserve enough history for later verification.
- Provide lightweight search so organized patient folders can be found again.

## Product boundary

DentalPhotoOrganizer may store metadata such as attending doctor, photographer, shooting method, photo type, and classification confidence when useful.

However, the product should not create new mandatory manual work merely to collect metadata that is not required for safe patient sorting.

The product is not primarily responsible for:

- advanced patient photo-library browsing,
- longitudinal treatment comparison,
- annotation or drawing tools,
- presentation or patient-explanation material generation,
- full-featured image editing,
- perfect automatic classification of every clinical photo type.

## Automation and AI

QR codes, barcodes, timestamps, file order, image characteristics, and AI may all be used as signals for provisional grouping.

None of these signals is the final authority on patient assignment.

Human confirmation remains mandatory before official export.

AI is an implementation tool for reducing manual work, not the product's purpose by itself.
