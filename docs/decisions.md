# DentalPhotoOrganizer Decisions

## Decision 0001

Title:
AI assists classification but does not make final decisions.

Reason:
Misclassification of medical photographs may result in patient identification errors.

Decision:
Human review remains mandatory before export.

Status:
Accepted

---

## Decision 0002

Title:
The application does not modify original image files.

Reason:
Medical data must remain available for future verification and auditing.

Decision:
All processing occurs on copies or metadata only.

Status:
Accepted

---

## Decision 0003

Title:
The application stores operation history.

Reason:
Clinical workflows require accountability and traceability.

Decision:
Review actions, approvals, and exports are logged.

Status:
Accepted

---

## Decision 0004

Title:
Export remains editable until final export execution.

Reason:
Human review can still miss errors.

Decision:
Users may correct assignments before export.

Status:
Accepted

---

## Decision 0005

Title:
The system supports patient-based photograph retrieval.

Reason:
Users need to find previously organized data after export.

Decision:
Search functions include patient information and should help users reach the recorded official export location.

Status:
Accepted

---

## Decision 0006

Title:
The system stores operator and attending doctor information when useful.

Reason:
Clinical photographs may require attribution and traceability.

Decision:
Photographs and groups may be associated with operator and doctor metadata. These fields are not automatically mandatory for the core patient-sorting workflow unless institutional or workflow requirements demand them.

Status:
Accepted

---

## Decision 0007

Title:
The application is desktop-first.

Reason:
Clinical staff primarily manage photographs on clinic workstations.

Decision:
The primary platform is Windows desktop via Electron.

Status:
Accepted

---

## Decision 0008

Title:
The application prioritizes local clinical storage over cloud image storage.

Reason:
Medical data protection and operational continuity favor keeping image files within the clinic environment.

Decision:
Photograph files remain within the clinic environment. Supabase is used for application metadata and workflow state, not as the required long-term image repository.

Status:
Accepted

---

## Decision 0009

Title:
Operator fatigue reduction is a design goal.

Reason:
Large volumes of photographs may require repetitive sorting and review.

Decision:
The interface should reduce unnecessary clicks, context switching, cognitive load, and avoidable metadata entry.

Status:
Accepted

---

## Decision 0010

Title:
Exported does not mean permanently locked.

Reason:
Clinical photo organization may require later correction or addition. A photo that was initially excluded from export may later become necessary, and a patient folder that was already exported may need additional photographs.

Decision:
The exported status means that the patient photo set has been exported at least once. It must not be treated as a permanent lock state. Future workflows should allow users to re-check exported patients, add or reclassify photographs when needed, and perform additional export without destroying existing exported files.

Design implications:
- Existing exported folders should not be deleted or overwritten silently.
- Additional export should prefer copying only newly needed photographs or otherwise avoid destructive changes.
- If full re-export is introduced later, it should preserve or back up the previous exported folder.
- A photograph excluded from export should remain available for later inclusion.

Status:
Accepted

---

## Decision 0011

Title:
Official exports are centralized to a configured export destination.

Reason:
After export, clinicians, residents, graduate students, or other staff may copy photographs to personal PCs, SD cards, USB drives, presentation folders, or research folders. Trying to track every secondary copy would make the application complex and unreliable. The application needs a clear boundary between the officially managed export result and later personal or departmental copying.

Decision:
DentalPhotoOrganizer manages only the official export destination configured for the clinic or department. Official exports should be written under that configured destination. Secondary copies from the official export folder to personal PCs, removable media, or other working folders are outside the application's tracking responsibility.

Design implications:
- The application should record the official export destination it created or used.
- Search should open only the recorded `official_export_folder_path`.
- The application should not attempt to detect or track later copies to personal PCs, SD cards, USB drives, or other external locations.
- Additional export should target the official export destination rather than arbitrary personal destinations.
- Existing files in the official export destination must not be deleted or overwritten silently.

Status:
Accepted

---

## Decision 0012

Title:
The core product problem is patient-by-patient sorting before formal storage.

Reason:
The largest operational burden is not viewing photographs after they are already assigned correctly. It is separating large volumes of mixed photographs by patient, confirming boundaries, correcting mixed-patient cases, and creating the final patient folders.

Decision:
DentalPhotoOrganizer is primarily a preprocessing and safety-confirmation tool for this upstream workflow. Product expansion should be evaluated against whether it reduces the human work required to sort photographs by patient safely.

Design implications:
- Patient sorting, correction, confirmation, and safe export have priority over general image-library features.
- Advanced longitudinal comparison, annotation, presentation generation, and full image-management behavior are not core requirements.
- AI is an implementation method, not the product purpose.

Status:
Accepted

---

## Decision 0013

Title:
Processing units and final storage units are different concepts.

Reason:
The application may create multiple provisional patient photo sets during import and review. These internal groups should not force the clinic's permanent folder structure.

Decision:
Patient photo sets remain internal processing/review units. The target final storage unit is patient × shooting date. Multiple internal photo sets for the same patient and shooting date may be organized into the same official destination.

Design implications:
- Database grouping structure must not dictate folder structure unnecessarily.
- Same-patient, same-day additional photographs should be supportable without creating artificial subfolders merely because they came from different internal groups.
- Detailed post-export organization may still be performed manually if desired.

Status:
Accepted

---

## Decision 0014

Title:
Final output filenames use simple sequential numbering by default.

Reason:
Photo type and laterality can be misclassified or corrected later. Embedding these interpretations in filenames increases correction cost and can create misleading output.

Decision:
Final exported filenames should use simple numbering such as `001.jpg`, `002.jpg`, `003.jpg` by default. Photo type, laterality, and similar information may remain as database metadata but should not be required in filenames.

Design implications:
- Output naming should be independent of mutable classification labels.
- Additional export must avoid filename collisions and silent overwrites.
- File extensions may be preserved according to the actual output format.

Status:
Accepted

---

## Decision 0015

Title:
The official export folder is the durable organized output; the database is an index and workflow store.

Reason:
Clinical photographs should remain accessible as ordinary files even if the application or database is unavailable in the future. Making the database the sole authority for accessing exported photographs would create unnecessary long-term dependency.

Decision:
The official clinic folder is the durable organized output. The database stores assignment metadata, workflow state, traceability, export destination records, and search indexes.

Design implications:
- Search should primarily help users find the recorded official folder.
- Post-export manual organization must not automatically invalidate access to the photographs.
- The product should not require a full in-app photo library merely to retrieve exported data.

Status:
Accepted

---

## Decision 0016

Title:
Optional metadata must not create disproportionate manual workload.

Reason:
The product exists to reduce manual work. Requiring users to fill or correct every possible metadata field can offset the time saved by automatic patient sorting.

Decision:
Patient ID and shooting date are core to the target storage workflow. Attending doctor, photographer, shooting method, photo type, laterality, and similar fields may be retained and used where valuable, but should become mandatory only for a clear safety, workflow, institutional, or research reason.

Status:
Accepted
