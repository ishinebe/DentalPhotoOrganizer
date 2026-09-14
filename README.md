# DentalPhotoOrganizer

DentalPhotoOrganizer is a preprocessing and safety-confirmation tool for dental clinical photographs.

It is not intended to be a general-purpose dental image management system. Its primary purpose is to reduce the human workload required to sort large numbers of clinical photographs by patient before they are placed in the clinic's normal storage folders.

## Product Purpose

The core problem is manual patient-by-patient photo sorting.

In the current workflow, photographs from multiple patients may be stored together on an SD card or similar storage medium. A staff member later has to identify patient boundaries, separate photographs, correct mixed-patient cases, create folders, and move the photographs to the correct storage location.

DentalPhotoOrganizer should reduce that work while preserving safety.

The primary product question is:

> Does this feature reduce the human work required to sort photographs by patient safely?

If not, it should not be treated as core functionality without a clear reason.

## Core Workflow

1. Import photographs from an SD card or other source.
2. Preserve source images safely during processing.
3. Use QR/barcode, shooting order, timestamps, image characteristics, or other signals to provisionally separate photographs by patient.
4. Present the provisional patient groups to a human reviewer.
5. Allow the reviewer to confirm, move, split, or merge photographs when necessary.
6. After human confirmation, export the photographs into the clinic's normal storage folders.
7. Provide simple search/indexing so previously organized patient folders can be found again.

## Core Principles

- Human review is required before final export.
- AI is a means of reducing sorting work, not the product goal itself.
- Original/source images must not be destructively modified during review.
- Provisional grouping should be corrected through metadata and grouping operations rather than by editing source files.
- The final clinic storage folder is the long-term authority for organized clinical photographs.
- DentalPhotoOrganizer's database is primarily for processing state, audit history, and search/indexing.
- A shooting set is a processing/review unit, not necessarily the final storage unit.
- The default final storage unit is patient × shooting date.
- Photos from the same patient on the same date may be stored in the same folder even if they came from multiple shooting sets.
- Exported filenames should remain simple and robust, such as sequential numbering (`001.jpg`, `002.jpg`, ...).
- Image type, laterality, shooting protocol, doctor, and photographer are useful metadata, but they must not create unnecessary manual work or become mandatory unless clearly needed.

## Review Screen Goal

The main Review task is simple:

> Confirm that the provisionally grouped photos belong to the same patient, and correct the grouping if they do not.

The normal flow should be:

1. Look at the photos.
2. Confirm that they belong to the same patient.
3. If correct, complete confirmation.
4. If incorrect, move, split, or merge photos quickly.

The UI should avoid developer-oriented terminology and should not imply that AI has made a final patient-identification decision.

## Search Scope

Search is a support function, not the main product.

Its purpose is to help users find previously organized patient photo folders and open the final storage location. DentalPhotoOrganizer should not expand into a full-featured image viewer, annotation system, or longitudinal comparison platform unless there is a separate, explicit product decision to do so.

## Non-Goals

The current product should not prioritize:

- full-featured dental image management,
- advanced image editing,
- treatment-plan or presentation generation,
- detailed annotation or drawing tools,
- automatic definitive image-type classification,
- longitudinal comparison views,
- replacing the clinic's existing long-term storage system.

## Documentation

The highest-level product definition is:

- `PRODUCT_PRINCIPLES.md`

Supporting documentation is stored under `docs/`:

- `docs/requirements.md.txt`
- `docs/workflow.md.txt`
- `docs/db_schema.md.txt`
- `docs/ui_principles.md`
- `docs/development_phases.md`
- `docs/competitive_analysis.md`

When implementation details conflict with `PRODUCT_PRINCIPLES.md`, the product principles should be reviewed first before extending the implementation.

## Development

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Run lint:

```bash
npm run lint
```

Run production build:

```bash
npm run build
```

## Current Stage

The project is in a prototype and workflow-validation phase.

The current priority is to complete and validate the end-to-end workflow from mixed-source import to patient-level confirmation and safe export, before adding broader image-management features.
