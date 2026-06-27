# Shooting Method and Photo Standard Check

This document records the current implementation and intended behavior for shooting method selection and photo standard checking in DentalPhotoOrganizer.

The purpose of this document is to prevent AI coding agents from assuming that shooting method support is unimplemented just because the user-facing UI term is Japanese and the internal implementation uses `photo_protocol`.

---

## User-facing term

UI term:
撮影方法

Preferred English explanation:
shooting method

Internal term:
photo protocol / `photo_protocol`

Important note:
Use 「撮影方法」 in user-facing UI. Use `photo_protocol` only when referring to internal code or database fields.

---

## Current implementation state

Shooting method support is implemented in the patient information / photo review workflow.

Current implementation includes:

- A 「撮影方法」 select control in the patient information / photo review screen.
- Saving the selected method to `photo_groups.photo_protocol`.
- Photo type labels for each photo, stored as `photos.photo_type`.
- Photo type select candidates filtered by the selected shooting method.
- A 「撮影基準チェック」 panel for the selected patient photo group.
- Required-photo checks for 5-view, 9-view, and 14-view methods.
- Warning display for missing required photo types.
- Warning display for unclassified photos.
- Warning display for photos labeled as その他.

---

## Current shooting method values

The current internal values are:

| UI label | Internal value | Required-photo check |
| --- | --- | --- |
| 5枚法 | `five_view` | Defined |
| 9枚法 | `nine_view` | Defined |
| 14枚法 | `fourteen_view` | Defined |
| 部分撮影 | `partial` | No missing-photo check |
| その他 | `other` | No missing-photo check |

The default shooting method is `five_view`.

---

## Formal photo type master

Photo type labels include clinical photo labels and auxiliary labels.

Clinical photo labels are used for shooting method completeness checks.
Auxiliary labels are available for management and review but are not counted as required clinical photos.

### Auxiliary labels

These labels may be available as selectable photo types where appropriate, but they are not required photo types for 5枚法, 9枚法, or 14枚法.

- QR
- その他
- 未分類

Important:
QR is a management image, not a component of 5枚法, 9枚法, or 14枚法.

---

## Required clinical photo types

### 5枚法

Required clinical photo types:

- 正面観
- 右側方面観
- 左側方面観
- 上顎咬合面観
- 下顎咬合面観

### 9枚法

Required clinical photo types:

- 正面観
- 右側方面観
- 左側方面観
- 上顎咬合面観
- 下顎咬合面観
- 上顎右側臼歯部
- 上顎左側臼歯部
- 下顎右側臼歯部
- 下顎左側臼歯部

### 14枚法

Required clinical photo types:

- 正面観
- 右側方面観
- 左側方面観
- 上顎咬合面観
- 下顎咬合面観
- 上顎前歯部
- 下顎前歯部
- 上顎右側臼歯部
- 上顎左側臼歯部
- 下顎右側臼歯部
- 下顎左側臼歯部
- 右側臼歯部咬合面観
- 左側臼歯部咬合面観
- 前歯部咬合状態

### 部分撮影 / その他

For 部分撮影 and その他, the application should not perform a missing-photo check.

These values are used when the standard 5枚法, 9枚法, or 14枚法 completeness expectation is not appropriate.

---

## Photo type select candidates

Photo type select candidates should be generated from the selected shooting method.

The select candidates should include:

1. the required clinical photo types for the selected shooting method, and
2. the auxiliary labels that are appropriate for review: QR, その他, 未分類.

### 5枚法 candidates

- 正面観
- 右側方面観
- 左側方面観
- 上顎咬合面観
- 下顎咬合面観
- QR
- その他
- 未分類

### 9枚法 candidates

- 正面観
- 右側方面観
- 左側方面観
- 上顎咬合面観
- 下顎咬合面観
- 上顎右側臼歯部
- 上顎左側臼歯部
- 下顎右側臼歯部
- 下顎左側臼歯部
- QR
- その他
- 未分類

### 14枚法 candidates

- 正面観
- 右側方面観
- 左側方面観
- 上顎咬合面観
- 下顎咬合面観
- 上顎前歯部
- 下顎前歯部
- 上顎右側臼歯部
- 上顎左側臼歯部
- 下顎右側臼歯部
- 下顎左側臼歯部
- 右側臼歯部咬合面観
- 左側臼歯部咬合面観
- 前歯部咬合状態
- QR
- その他
- 未分類

### 部分撮影 / その他 candidates

For 部分撮影 and その他, the UI may show all standard photo type candidates because the expected set is intentionally non-standard.

If existing saved data contains a photo type that is outside the current shooting method candidates, the UI should keep that current value visible so the user can review or correct it without losing data.

---

## Review workflow behavior

During patient information / photo review:

1. The user opens a patient photo group.
2. The user checks or edits patient ID, shooting date, attending doctor, photographer, and shooting method.
3. The user checks or edits each photo type label.
4. The application compares the photo type labels against the selected shooting method.
5. If required photo types are missing, the UI shows them as possibly missing.
6. If photos are 未分類 or その他, the UI shows a caution.
7. The user can correct photo type labels before confirmation.

The check is an assistive review aid. It does not replace human confirmation.

---

## Export and search relationship

Export and Search may display the selected shooting method as metadata.

The shooting method helps users understand what kind of clinical photo set the patient photo group represents.

Do not use the shooting method to bypass photo review or export confirmation.

---

## Implementation references

Current code references:

- `src/lib/photoTypes.ts`
  - photo type definitions
  - shooting method definitions
  - required photo type definitions for 5枚法, 9枚法, and 14枚法
  - shooting-method-specific photo type candidates
- `src/lib/reviewGroups.ts`
  - `photo_protocol` in `ReviewGroup` and `ReviewGroupForm`
  - reading and saving `photo_groups.photo_protocol`
- `src/App.tsx`
  - `photoProtocolDefinitions`
  - shooting method select control
  - photo standard check panel
  - missing required photo type display
  - unclassified / other caution display

---

## Non-goals and cautions

- Do not rename `photo_protocol` to `shooting_protocol` without a deliberate migration plan.
- Do not treat `supabase/schema.sql` as the complete source of truth for current DB state.
- Do not mark a photo group as confirmed only because the shooting method check passes.
- Do not block all partial or non-standard photo sets just because they do not match 5枚法, 9枚法, or 14枚法.
- Do not treat QR as a required clinical photo for 5枚法, 9枚法, or 14枚法.
