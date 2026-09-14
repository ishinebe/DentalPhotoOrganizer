# Development Phases

This document defines staged development for DentalPhotoOrganizer.

The development order should be driven primarily by completion of the real sorting workflow, not by increasing sophistication of image classification.

The core product flow is:

1. import mixed-source photos,
2. provisionally separate them by patient,
3. let a human confirm and correct the grouping quickly,
4. safely export confirmed photos into patient × shooting-date folders,
5. provide simple search to reopen the final storage location.

AI, shooting protocols, and image-type classification are supporting techniques inside this flow, not independent product goals.

---

## Phase 1: Safe Import and Basic Patient Separation

### Goal

Prove that mixed photos can be imported safely and provisionally separated by patient using simple, reliable signals.

### Scope

- import from selected storage/folder,
- preserve source images or a safe working copy,
- detect QR/barcode when present,
- use QR/barcode and shooting order as provisional patient boundaries,
- create provisional patient groups,
- avoid destructive edits to source images.

### Validation Points

- source images are not lost,
- patient groups are created consistently,
- missing QR/barcode cases remain visible rather than being silently finalized,
- duplicate import or overwrite risks are controlled.

---

## Phase 2: Fast Human Confirmation and Correction

### Goal

Reduce the manual work needed to confirm and correct provisional patient grouping.

### Scope

- Review screen centered on photos rather than metadata editing,
- confirm that photos belong to the same patient,
- move photos between existing patients,
- split photos into a new patient group,
- merge patient groups when necessary,
- clearly surface uncertain patient-boundary cases.

### Validation Points

- ordinary cases can be confirmed quickly,
- mixed-patient cases can be corrected without touching source files manually,
- drag-and-drop or equivalent correction is faster than the existing folder-based workflow,
- users do not need to understand internal database concepts.

---

## Phase 3: Safe Final Export

### Goal

Replace manual folder creation and file movement with a safe, predictable export process.

### Scope

- export only human-confirmed patient groups,
- default final storage unit is patient × shooting date,
- combine multiple confirmed shooting sets from the same patient and date when appropriate,
- keep photos from the same patient/date in the same folder by default,
- use simple sequential filenames such as `001.jpg`, `002.jpg`, ...,
- preserve original file extension where practical,
- prevent accidental overwrite or folder-name collision,
- record export destination and export time,
- verify that export completed successfully before temporary working data can be discarded.

### Validation Points

- users no longer need to manually create patient folders for routine cases,
- filenames do not encode changeable semantics such as laterality or image type,
- re-export or repeated import does not destroy existing data,
- exported photos remain usable without DentalPhotoOrganizer.

---

## Phase 4: Simple Search and Retrieval

### Goal

Help users find previously organized photos without turning DentalPhotoOrganizer into a full image-management platform.

### Scope

- patient ID search,
- shooting-date search,
- include exported data in search results,
- show final storage destination,
- open the final storage folder directly.

### Validation Points

- a user can find the patient/date folder quickly,
- search remains lightweight,
- the final storage folder, not the application database, remains the long-term photo authority.

---

## Phase 5: Robustness for Real-World Variation

### Goal

Improve provisional separation and warning quality for cases where QR/barcode boundaries are incomplete or clinical photo patterns vary.

### Target Cases

- missing QR/barcode,
- variable photo counts,
- partial photo series,
- face photos,
- surgical photos,
- GBR / CTG / implant surgery,
- unusually long or short time gaps,
- suspected mixed-patient cases.

### Possible Techniques

- timestamps,
- shooting sequence,
- image similarity,
- expected photo-count hints,
- optional AI-based outlier detection.

### Validation Points

- uncertain cases are surfaced for human confirmation,
- the system does not force all photos into fixed five-/nine-/fourteen-photo categories,
- AI output never becomes the final patient-identification decision.

---

## Phase 6: Optional Metadata Assistance

### Goal

Add useful metadata only where it improves downstream retrieval or reduces work.

### Possible Functions

- doctor selection or recognition,
- photographer selection or recognition,
- shooting protocol,
- image-type suggestions,
- laterality suggestions,
- optional tags or notes.

### Constraint

Metadata entry must not become a new mandatory manual burden for routine export unless there is a clear operational reason.

Image type and laterality should remain metadata, not filename semantics.

---

## Current Non-Priorities

The following should not drive development until the core workflow is validated:

- full-featured patient photo library,
- longitudinal treatment comparison,
- advanced annotation,
- image editing,
- presentation generation,
- printing workflows,
- definitive automatic image-type classification,
- replacing the clinic's existing long-term image-management/storage system.

---

## Product Decision Rule

Before adding a major feature, ask:

> Does this reduce the human work required to sort and safely store photographs by patient?

If not, treat it as secondary or out of scope unless there is a separate explicit product decision.
