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
Photographs are used for clinical treatment, research, education, and certification documentation.

Decision:
Search functions include patient information.

Status:
Accepted

---

## Decision 0006

Title:
The system stores operator and attending doctor information.

Reason:
Clinical photographs often require attribution and traceability.

Decision:
Photographs and groups may be associated with operator and doctor metadata.

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
The application prioritizes local storage over cloud storage.

Reason:
Medical data protection requirements make local-first architecture preferable.

Decision:
Photographs remain within the clinic environment.

Status:
Accepted

---

## Decision 0009

Title:
Operator fatigue reduction is a design goal.

Reason:
Large volumes of photographs are reviewed daily.

Decision:
The interface should reduce unnecessary clicks, context switching, and cognitive load.

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
- Future UI may allow each photograph to be marked as included in export or excluded from export.
- A photograph excluded from export should remain available for later inclusion.

Status:
Accepted
