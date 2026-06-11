# DentalPhotoOrganizer

DentalPhotoOrganizer is a dental photo management system for organizing intraoral photographs with AI-assisted provisional grouping and human review.

## Purpose

This project aims to reduce the workload involved in importing, sorting, reviewing, and exporting dental clinical photographs.

The system is designed to support the workflow in which intraoral photographs are first provisionally grouped by patient or shooting set, then reviewed by a human operator before final export.

## Core Principles

- Original image files must remain unchanged.
- Patient assignment and metadata are managed in the database.
- AI is used only for provisional grouping and flagging suspicious cases.
- Human review is required before final export.
- All shooting sets, including non-flagged sets, must be confirmed by a reviewer.
- Final export occurs only after human confirmation.
- Doctor and photographer should be selected from a registered staff list instead of free-text entry.
- Patient ID input should be restricted and supported by search/autocomplete when possible.
- Barcode or QR missing cases should be clearly marked as requiring attention.

## Current Workflow Concept

1. Import images from a storage source.
2. Store original images without modifying, renaming, or deleting them.
3. Detect barcode or QR images when available.
4. Create provisional shooting sets.
5. Flag sets or images that may require attention.
6. Review each shooting set in the application.
7. Confirm that no other patient's images are mixed in.
8. Approve the shooting set.
9. Export approved data to the final storage location.

## Main Review Task

The Review screen should be understood as a shooting set confirmation screen.

The user's task is to confirm whether the AI-provisionally grouped shooting set contains only images from the same patient.

The UI should avoid system-oriented terms such as "group" or "approval" where possible, and instead use workflow-oriented wording such as:

- Shooting set confirmation
- Shooting set waiting for confirmation
- Patient ID
- Doctor
- Photographer
- No issue / move to next shooting set

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

## Documentation

Project documentation is stored under the `docs/` directory.

- `docs/requirements.md`
- `docs/workflow.md`
- `docs/db_schema.md`

## Notes

This project is currently in the prototype and workflow-validation phase.

The initial prototype prioritizes workflow validation, UI clarity, QR/barcode-based grouping, review, approval, and search. Direct SD-card integration and Electron-specific automation can be considered in later phases.
