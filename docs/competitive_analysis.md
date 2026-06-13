# Competitive Analysis

This document summarizes the positioning of DentalPhotoOrganizer compared with existing dental photo management software and identifies functions that should or should not be incorporated into this project.

## Existing Software Categories

Existing dental photo management products can be roughly divided into three categories.

### 1. Image Management and Viewing Software

Examples include products that manage intraoral photographs, panoramic images, dental radiographs, cephalometric images, facial photos, and other clinical images by patient and date.

Typical features:

- patient-based image management
- date-based image management
- chronological display
- comparison between visits
- layout display for intraoral photo series
- basic editing such as rotation, trimming, and resizing
- export and printing
- annotation or memo functions

### 2. Photography Support Software

Some products support the photography process itself, especially when using smartphones or camera-linked workflows.

Typical features:

- simplified intraoral photography
- automatic naming using patient number, date, and image type
- support for five-photo or nine-photo series
- mirror-image correction
- rotation correction
- shooting-position guidance

### 3. Cloud-Based Dental Image Management Platforms

Some products manage clinical photos, videos, and documents in cloud-based environments.

Typical features:

- patient-based image and video management
- tag-based search
- date-based search
- favorite or memo functions
- image annotation
- multi-device access
- authentication and security functions
- integration with other dental systems or devices

## Positioning of DentalPhotoOrganizer

DentalPhotoOrganizer should not be positioned simply as a replacement for existing dental image viewing or patient explanation software.

Its primary value is in the upstream workflow before clinical images are formally registered in a final storage location or image management system.

The target problem is:

1. large numbers of intraoral photographs are stored on SD cards
2. photos are manually imported about once per week
3. reception-sheet barcode images are used as patient boundaries
4. barcode images may be missing
5. folder names may overlap
6. patient boundaries must be checked manually
7. there is a risk of data loss or mixed-patient photo assignment

Therefore, DentalPhotoOrganizer is best understood as a preprocessing and safety-confirmation layer.

It supports:

- safe import
- immutable original image preservation
- QR/barcode-based provisional grouping
- missing-code warning
- suspicious mixed-patient detection
- human confirmation of each shooting set
- approved export
- search by patient ID, shooting date, doctor, and photographer

## Key Differentiation

### 1. Focus on Pre-Registration Workflow

Many existing products focus on managing images that have already been correctly assigned to a patient.

DentalPhotoOrganizer focuses on the step before that:

- importing mixed SD-card photos
- detecting patient boundaries
- preventing folder-name collisions
- preventing accidental data loss
- reducing the burden of manual sorting

### 2. QR/Barcode as a Provisional Boundary

DentalPhotoOrganizer treats QR or barcode images as provisional shooting-set boundaries.

If the QR/barcode is missing or unreadable, the system does not automatically finalize the group. Instead, it clearly flags the case as requiring attention.

### 3. AI as Suspicious-Case Detection, Not Final Identification

The system should not use AI to definitively identify patients.

Instead, AI should be used to detect:

- possible mixed-patient photos
- images with low similarity to the rest of the shooting set
- suspicious time gaps
- unusually large or small photo sets

Final confirmation remains the responsibility of the human reviewer.

### 4. Immutable Original Files and Database-Centered Management

DentalPhotoOrganizer is based on the following principles:

- original files are never renamed, modified, moved, or deleted during review
- patient assignment is managed as database metadata
- provisional grouping can be corrected without changing original files
- final export happens only after human confirmation

This is important for clinical safety, auditability, and future research use.

### 5. Human Confirmation and Auditability

All shooting sets, including those not flagged by AI, must be confirmed by a reviewer before export.

The system should record:

- who confirmed the shooting set
- when it was confirmed
- what metadata was changed
- whether export was performed

This makes the responsibility boundary clear.

### 6. Doctor and Photographer Tracking

DentalPhotoOrganizer should distinguish between:

- doctor: the clinician responsible for the case
- photographer: the person who actually took the photo
- reviewer: the person who confirmed the shooting set

Doctor and photographer should be selected from a staff master list instead of being typed freely.

This supports consistent search and avoids name-variation problems.

## Functions Worth Incorporating

### 1. Timeline and Date-Based Display

Existing image management software often emphasizes chronological display.

DentalPhotoOrganizer should eventually support:

- patient ID search
- list of shooting dates for the patient
- shooting-set history by date
- comparison of photo sets over time

### 2. Shooting-Set Layout Display

For standard five-photo series, it may be useful to show photos in a structured layout.

Possible future layout:

- frontal view
- right lateral view
- left lateral view
- upper occlusal view
- lower occlusal view

However, this should not be required in the earliest prototype.

### 3. Basic Image Viewing Support

The Review screen should support efficient confirmation.

Useful functions:

- thumbnail display
- enlarged preview
- switching selected photo
- basic rotation display if needed
- QR/barcode images displayed as small thumbnails rather than dominant preview images

### 4. Tags and Notes

Future search and research use may benefit from tags.

Potential tags:

- initial visit
- reevaluation
- SPT
- preoperative
- postoperative
- GBR
- CTG
- implant
- needs recheck

Notes should be optional.

### 5. Patient Search and Autocomplete

When QR/barcode reading fails, patient ID should not be unrestricted free text whenever possible.

The system should support:

- patient ID format validation
- patient search
- autocomplete
- selection from candidates
- clear warning for missing QR/barcode cases

## Functions Not Prioritized

DentalPhotoOrganizer should not initially focus on:

- presentation material generation
- treatment-plan document generation
- patient explanation slides
- detailed annotation or drawing tools
- printing functions
- full-featured image editing

These are valuable in some existing systems, but they are not the core problem this project addresses.

The current project should remain focused on:

- safe import
- provisional grouping
- mixed-patient warning
- human confirmation
- final export
- metadata search

## Research Significance

Existing dental image management software is generally strong after images are already assigned to the correct patient.

However, in workflows where large numbers of SD-card photos are manually sorted using reception-sheet barcode images as boundaries, there remains a practical problem:

- missing barcode images
- uncertain patient boundaries
- folder-name duplication
- manual confirmation workload
- risk of accidental data loss or mixed-patient storage

DentalPhotoOrganizer addresses this pre-registration workflow.

A possible research framing is:

> Existing dental image management software provides functions for patient-based viewing, chronological comparison, annotation, and export after images have been registered. In contrast, this project focuses on the preceding workflow: safely importing mixed SD-card photographs, creating provisional shooting sets using QR/barcode cues, detecting missing-code or mixed-patient risks, requiring human confirmation, and exporting only approved sets. This provides a safety-oriented preprocessing layer for dental clinical image management.

## Development Implication

DentalPhotoOrganizer should continue to prioritize workflow clarity over feature expansion.

The Review screen should be designed as a shooting set confirmation screen, not as a generic image viewer.

The most important user task is:

> Confirm that the AI-provisionally grouped shooting set does not contain photos from another patient.

This task should remain visible in the UI at all times.
