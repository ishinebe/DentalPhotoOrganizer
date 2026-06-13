# Development Phases

This document defines the staged development and data-collection strategy for DentalPhotoOrganizer.

## Basic Direction

DentalPhotoOrganizer should not attempt to handle every clinical photo pattern from the beginning.

The initial phases should focus on stable, well-structured data and gradually expand to more variable real-world clinical data.

The goal is to validate the workflow first:

1. QR/barcode-based separation
2. provisional shooting set creation
3. human confirmation
4. final export
5. search by patient ID, shooting date, doctor, and photographer

AI should initially support provisional grouping and suspicious-case detection, not autonomous final classification.

---

## Phase 1: Standard Five-Photo Series With QR/Barcode

### Target Data

- Standard intraoral five-photo series
- QR/barcode image is present
- Patient boundary is clear
- Number of photos is relatively fixed
- Shooting date is clear
- No known mixed-patient photos
- Human-confirmed clean data

### Purpose

Validate the core workflow under stable conditions.

### Validation Points

- QR/barcode can be used as a shooting-set boundary
- provisional shooting sets are created correctly
- Review UI is understandable
- reviewer can confirm the set efficiently
- approved sets can be exported

---

## Phase 2: Standard Five-Photo Series With Missing QR/Barcode Cases

### Target Data

- Standard intraoral five-photo series
- Some cases have missing QR/barcode images
- Patient boundaries may be partially unclear

### Purpose

Evaluate how the system handles missing QR/barcode cases.

### Validation Points

- missing QR/barcode cases are clearly flagged
- patient ID manual entry is restricted by format validation
- patient search/autocomplete can reduce input errors
- suspected boundary issues are sent to confirmation rather than automatically finalized

---

## Phase 3: Variable Number of Clinical Photos

### Target Data

- Intraoral photos with variable numbers of images per patient
- Multiple clinical patterns beyond fixed five-photo series
- Still mainly ordinary clinical photographs rather than surgical photos

### Purpose

Evaluate whether shooting-set based review works when photo counts vary.

### Validation Points

- reviewer can understand each shooting set even when the number of photos differs
- suspiciously large or small sets are flagged
- time gaps and image similarity can be used as hints for possible patient-boundary errors

---

## Phase 4: Surgical and Soft-Tissue-Centered Photos

### Target Data

- GBR
- CTG
- implant-related surgery
- extraction or surgical photos
- soft-tissue-centered images
- bleeding or suturing scenes

### Purpose

Expand from standard intraoral photo grouping to more difficult clinical cases.

### Validation Points

- surgical photos are not forced into standard five-photo categories
- uncertain cases are flagged as requiring human confirmation
- AI is used for suspicious-case detection rather than definitive patient identification

---

## Data Collection Policy

Early training and validation data should be clean and structured.

Initial data collection should prioritize:

- standard five-photo series
- QR/barcode included
- confirmed same-patient image sets
- clear shooting date
- clear review result

Data that should be excluded from the earliest phase:

- missing QR/barcode cases
- unclear patient boundaries
- surgical photos
- GBR or CTG cases
- face photos
- heavily variable photo counts
- mixed-patient sets unless intentionally prepared for testing

These more complex cases should be introduced only after the basic workflow is stable.

---

## Safety Principle

The system should not automatically finalize patient assignment based only on AI output.

AI may suggest grouping or flag suspicious images, but final confirmation must be performed by a human reviewer.
