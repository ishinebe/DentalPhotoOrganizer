# DentalPhotoOrganizer Principles

## Product Focus

- The product's core task is patient-by-patient sorting of mixed dental photographs before formal storage.
- Product decisions should prioritize reducing manual sorting work without reducing safety.
- Existing implemented features are not automatically permanent core requirements.
- Feature expansion should not turn the product into a general-purpose image-management system without an explicit product decision.

## Data Preservation

- Original image files must never be modified by the application.
- Original image files must never be deleted by the application.
- Original image files must not be silently moved or overwritten.
- All processing must preserve the original source data until safe export is completed and verified.

## Processing Unit vs Storage Unit

- A patient photo set is an internal processing and review unit.
- A patient photo set is not necessarily the final folder structure.
- The target final storage unit is patient × shooting date.
- Multiple internal photo sets for the same patient and shooting date may ultimately belong in the same official storage folder.

## Official Output as Durable Organized Data

- The clinic's official export folder is the durable organized output of DentalPhotoOrganizer.
- The database is primarily used for assignment metadata, processing state, history, traceability, and search indexing.
- Organized photographs should remain usable as ordinary files even if DentalPhotoOrganizer is unavailable in the future.
- The application should not require permanent dependence on its own database merely to access exported photographs.

## Output Naming

- Final filenames should avoid embedding mutable interpretation such as photo type or laterality.
- Simple sequential names such as `001.jpg`, `002.jpg`, and `003.jpg` are preferred by default.
- Classification metadata may remain in the database when useful without becoming part of the filename.
- Existing files must not be overwritten silently when additional photographs are exported later.

## Human Oversight

- Automatic grouping and classification are assistive, not final decisions.
- Human photo review is required before official export.
- Classification confidence is a guide for attention, not a substitute for review.
- The primary review question is whether a provisional patient photo set contains only photographs from the same patient.
- Human operators must be able to correct grouping errors before export.

## Metadata Proportionality

- Patient ID and shooting date are core to the target storage workflow.
- Attending doctor, photographer, shooting method, photo type, laterality, and similar metadata may be useful.
- Optional metadata should not create disproportionate manual work.
- A metadata field should become mandatory only when there is a clear safety, workflow, institutional, or research requirement.

## Search Scope

- Search should primarily help users locate organized patient data and the recorded official export folder.
- Search should remain lightweight unless a broader image-management use case is deliberately adopted.
- Advanced longitudinal comparison, annotation, complex tagging, and full photo-library behavior are not core requirements.

## Auditability

- Important operations must be traceable.
- The system must preserve sufficient information for future investigation.
- Review history, correction history, and export history should be traceable.
- Traceability requirements should not be confused with unnecessary user-facing data entry.

## Usability

- Users with no development experience must be able to use the software.
- Common operations should be understandable without extensive training.
- Patient sorting, correction, and confirmation should require as few unnecessary actions as possible.
- Incorrect operations should be easy to correct or undo when practical.
- The interface should minimize cognitive load and decision fatigue.

## Accessibility

- Color must not be the only method used to convey important information.
- The system should remain usable for users with color vision deficiencies.

## Transparency

- The system should clearly indicate processing status.
- Users should easily understand what actions are available.
- Users should easily understand when intervention is required.
- Success and failure states must be visually obvious.
- Uncertain automatic results must not be presented as confirmed facts.

## Workflow Compatibility

- The software should fit existing clinical workflows whenever possible.
- The software should reduce manual work rather than create additional work.
- Detailed post-export organization should remain possible outside the application.
- DentalPhotoOrganizer should automate the difficult patient-sorting step without unnecessarily taking ownership of every later image-management task.
