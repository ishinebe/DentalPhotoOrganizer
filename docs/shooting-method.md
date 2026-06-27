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
- Required-photo checks for 5-view and 9-view methods.
- Warning display for missing required photo types.
- Warning display for unclassified photos.
- Warning display for photos labeled as その他.

---

## Current shooting method values

The current internal values are:

| UI label | Internal value | Required-photo check |
| --- | --- | --- |
| 5枚法 | `five_view` | Implemented |
| 9枚法 | `nine_view` | Implemented |
| 14枚法 | `fourteen_view` | Not yet defined in detail |
| 部分撮影 | `partial` | No missing-photo check |
| その他 | `other` | No missing-photo check |

The default shooting method is `five_view`.

---

## Required photo types

### 5枚法

The current required photo types are:

- 正面観
- 上顎咬合面観
- 下顎咬合面観

### 9枚法

The current required photo types are the 5枚法 types plus:

- 右側方面観
- 左側方面観

### 14枚法

14枚法 is selectable and saved, but the detailed required-photo definition is not finalized yet.

The UI should explain that 14枚法 detailed checking is future work rather than pretending that the check is complete.

### 部分撮影 / その他

For 部分撮影 and その他, the application should not perform a missing-photo check.

These values are used when the standard 5枚法 or 9枚法 completeness expectation is not appropriate.

---

## Photo type values

The current photo type labels include:

- 未分類
- QR
- 正面観
- 右側方面観
- 左側方面観
- 上顎咬合面観
- 下顎咬合面観
- 上顎右側臼歯部
- 上顎左側臼歯部
- 下顎右側臼歯部
- 下顎左側臼歯部
- その他

These are photo-level labels and should not be confused with the group-level shooting method.

Photo type select candidates are filtered by shooting method:

- 5枚法: QR, 正面観, 上顎咬合面観, 下顎咬合面観, その他.
- 9枚法: QR, 正面観, 右側方面観, 左側方面観, 上顎咬合面観, 下顎咬合面観, その他.
- 14枚法, 部分撮影, その他: all standard photo type candidates.

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
  - required photo type definitions for 5枚法 and 9枚法
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
- Do not block all partial or non-standard photo sets just because they do not match 5枚法 or 9枚法.
- Do not assume 14枚法 completeness is implemented until its required-photo definition is finalized.
