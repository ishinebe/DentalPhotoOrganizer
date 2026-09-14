# DentalPhotoOrganizer Product Principles

## 1. Product Purpose

DentalPhotoOrganizer is not a general-purpose dental image management system.

Its primary purpose is to reduce the human workload required to sort large numbers of dental clinical photographs by patient before those photographs are placed in the clinic's normal storage folders.

The product should be understood as a **preprocessing and safety-confirmation tool** for dental clinical photographs.

### Core problem

In the current workflow, photographs from multiple patients are stored together on an SD card or similar storage medium. A staff member later has to:

1. import a large number of photographs,
2. identify patient boundaries,
3. separate photographs by patient,
4. correct mixed-patient cases,
5. create patient folders,
6. move the photographs into the correct storage location.

This manual sorting work is the main problem that DentalPhotoOrganizer should solve.

### Primary success criterion

The most important product question is:

> Does this feature reduce the human work required to sort photographs by patient safely?

If the answer is no, the feature should not be treated as core functionality without a clear reason.

---

## 2. Core Workflow

The target workflow is:

1. Import photographs from an SD card or other source.
2. Preserve source images safely during processing.
3. Use QR/barcode, shooting order, timestamps, image characteristics, or other signals to provisionally separate photographs by patient.
4. Present the provisional patient groups to a human reviewer.
5. Allow the reviewer to quickly confirm, move, split, or merge photographs when necessary.
6. After human confirmation, export the photographs into the clinic's normal storage folders.
7. Provide simple search/indexing so previously organized patient folders can be found again.

The software should optimize this flow before expanding into unrelated image-management features.

---

## 3. Responsibility Boundary

### DentalPhotoOrganizer is responsible for

- safe import,
- provisional patient separation,
- detecting or surfacing suspicious patient boundaries,
- supporting fast human confirmation,
- allowing correction of mixed-patient cases,
- safe export to the final storage location,
- preventing accidental overwrites or folder-name collisions,
- maintaining enough metadata and history to support the workflow and basic search.

### Humans are responsible for

- final confirmation of patient assignment,
- correcting ambiguous or incorrect grouping,
- deciding whether the final result is safe to export,
- any detailed organization performed after export unless explicitly automated later.

### DentalPhotoOrganizer is not responsible for

- autonomous final patient identification,
- replacing the clinic's long-term image management system,
- performing complete clinical photo classification,
- maintaining perfect right/left or image-type labels,
- treatment planning,
- patient explanation materials,
- annotation-heavy image editing,
- full longitudinal comparison workflows.

---

## 4. Human Confirmation Is Required

Automatic grouping is provisional.

No algorithm, including AI, should be treated as the final authority for patient assignment.

The reviewer must be able to verify that a provisional patient group does not contain photographs from another patient.

The Review screen should therefore prioritize this task:

> Confirm that the photographs grouped together belong to the same patient.

When a mistake is found, correction should be faster than recreating the grouping manually.

Important correction operations include:

- move a photograph to another existing patient group,
- split one or more photographs into a new patient group,
- merge patient groups when appropriate.

---

## 5. Processing Unit and Storage Unit Are Different

A **shooting set** is an internal processing and review unit.

It is not necessarily the final storage unit.

The final storage unit should be based primarily on:

> **patient × shooting date**

If the same patient has multiple provisional shooting sets on the same date, those sets may be exported into the same date-level folder after confirmation.

This distinction should remain explicit:

- shooting set = processing/review concept,
- patient × shooting date = final storage concept.

Internal database structure should not dictate the final folder structure unless required for safety.

---

## 6. Final Storage Is the Clinical Source of Truth

After successful export, the clinic's normal storage folder should be treated as the long-term clinical source of truth for the exported photographs.

DentalPhotoOrganizer's database should primarily act as:

- workflow state,
- processing metadata,
- audit/history information,
- a search/index layer.

The application should not require the exported photographs to remain dependent on DentalPhotoOrganizer in order to be usable.

A clinic should still be able to access exported photographs with ordinary file-system tools even if DentalPhotoOrganizer is unavailable in the future.

### Design implication

Do not create unnecessary proprietary storage structures that make the photographs difficult to use outside the application.

---

## 7. File Naming Principle

Exported file names should be simple and should not encode uncertain clinical meaning.

Preferred approach:

```text
001.jpg
002.jpg
003.jpg
...
```

The exact extension may follow the exported image format.

Do not require file names such as:

```text
right_buccal.jpg
left_buccal.jpg
upper_occlusal.jpg
```

because image-type classification may be incorrect, later corrected, or unnecessary.

### Rule

File names are identifiers, not clinical metadata.

Clinical meaning, when useful, belongs in metadata rather than the file name.

---

## 8. Photo Type Classification Is Optional Metadata

Photo-type classification such as frontal, right lateral, left lateral, maxillary occlusal, or mandibular occlusal may be useful, but it is not required for the core workflow to succeed.

The system must remain usable even when:

- image type is unknown,
- left/right classification is uncertain,
- extra photographs are mixed into a standard series,
- surgical or miscellaneous photographs are present.

Photo-type classification should therefore be treated as optional metadata or a future convenience feature, not as a prerequisite for safe patient sorting and export.

Shooting protocols such as 5-photo, 9-photo, or 14-photo series may still be used as hints for expected counts or warnings, but they must not become a rigid storage model.

---

## 9. AI Is an Implementation Tool, Not the Product Goal

The product goal is not "use AI to classify dental photographs."

The product goal is:

> reduce the manual work required to separate photographs by patient safely.

AI may help achieve this, but it is only one possible implementation method.

Useful signals may include:

- QR/barcode boundaries,
- shooting order,
- timestamps,
- image similarity,
- image-content models,
- photo-count patterns,
- other future heuristics.

The architecture should allow these signals to evolve without changing the product's core purpose.

The UI should not overstate AI certainty or make AI the main actor.

Preferred framing:

> Photographs have been provisionally organized. Please confirm the patient grouping.

---

## 10. Search Is a Supporting Function

Search exists to help users find photographs that DentalPhotoOrganizer has already organized.

Its primary purpose is not to turn DentalPhotoOrganizer into a full patient photo library.

A useful search flow is:

1. search by patient ID or other basic metadata,
2. see available shooting dates,
3. open the final storage folder.

The application may show simple thumbnails or metadata when useful, but advanced image-management features should not be prioritized unless they clearly support the core sorting workflow.

### Not core search goals

- sophisticated longitudinal comparison,
- treatment-progress visualization,
- annotation systems,
- presentation generation,
- full replacement of existing clinical image-management software.

---

## 11. Metadata Should Not Create New Work Without Clear Value

Metadata is useful only when its value exceeds the burden of entering or maintaining it.

### Core metadata

The most important metadata is information required to sort and export safely, especially:

- patient ID,
- shooting date,
- export destination,
- review/confirmation state,
- processing history needed for safety.

### Supporting metadata

Fields such as doctor, photographer, shooting protocol, photo type, tags, or notes may be useful, but they should not create unnecessary mandatory input steps unless operational value justifies them.

The product should avoid replacing one manual sorting burden with another manual metadata-entry burden.

---

## 12. Original Image Safety

Source images must not be destructively modified during review and sorting.

The system should maintain a safe working process until export has completed successfully.

The important requirement is:

> A processing or export failure must not cause loss of the original clinical photographs.

This does not automatically mean that every intermediate copy must be retained forever.

Long-term retention of working copies should be defined separately as an operational policy rather than being assumed to be part of the product's core purpose.

---

## 13. UI Principle

The interface should reflect the user's clinical workflow, not the database structure or implementation details.

The normal path should feel simple:

```text
Import
  ↓
Patient grouping
  ↓
Human confirmation
  ↓
Correction if necessary
  ↓
Final storage
```

The Review screen should emphasize photographs and patient-boundary confirmation.

Technical concepts such as UUIDs, raw status fields, confidence scores, table names, or internal grouping IDs should not dominate the clinical UI.

---

## 14. Development Priority

Development should be prioritized by completion of the real operational workflow, not by technical sophistication.

Recommended priority order:

1. reliable import,
2. reliable provisional patient separation,
3. efficient human confirmation,
4. fast correction of grouping mistakes,
5. safe patient/date-based export,
6. simple retrieval of exported folders,
7. accuracy and automation improvements,
8. optional convenience features.

AI classification sophistication, detailed photo-type labeling, or advanced library features should not delay completion of the core workflow.

---

## 15. Decision Rule for New Features

Before adding a feature, ask the following questions:

1. Does it reduce manual patient-sorting work?
2. Does it reduce the risk of storing a photograph under the wrong patient?
3. Does it make correction or confirmation faster?
4. Does it make safe export more reliable?
5. Does it make already organized photographs easier to locate without turning this product into a general image-management system?

If the answer to all five questions is no, the feature is probably outside the core scope.

When convenience conflicts with simplicity, prefer the solution that keeps the patient-sorting workflow clear and reliable.

---

## 16. Product Definition

DentalPhotoOrganizer should be described as:

> **A workflow tool that safely and efficiently separates mixed dental clinical photographs by patient, supports human confirmation and correction, and exports the confirmed photographs into ordinary clinic storage folders.**

This definition should guide requirements, UI design, database design, issue prioritization, and AI coding-agent instructions.