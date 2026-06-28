# UI Principles

This document defines the UI wording and design principles for DentalPhotoOrganizer.

The purpose is to prevent developer-oriented or database-oriented wording from appearing in the user interface, especially when new UI elements are added by AI coding agents.

## Core Principle

The screen should not feel like a system operation screen.

It should feel like a clinical workflow support screen.

Users should understand what to do without knowing the database structure, internal implementation, or AI processing steps.

## Target Users

Primary users:

- dentists
- dental hygienists
- clinical staff
- reviewers responsible for confirming photo sets

The UI should assume that the user is familiar with dental clinical workflow, but not with software development terms.

## Main UX Goal

The most important task is:

> Confirm that the AI-provisionally grouped shooting set does not contain photos from another patient.

Every Review-related screen should make this task obvious.

## General Wording Rules

### Use workflow-oriented language

Use words that match what the clinical user is doing.

Preferred examples:

- 撮影セット
- 撮影セット確認
- 確認待ち
- 患者番号
- 撮影日
- 担当医
- 撮影者
- 問題なし
- 次の撮影セットへ
- 一時保存
- 確認が必要です

### Avoid developer-oriented language

Avoid exposing database or implementation concepts directly.

Avoid examples:

- Group
- Photo Group
- Review
- Approve
- Pending
- UUID
- Record
- Entity
- Metadata update
- Export status
- Review status

These concepts may exist internally, but they should be translated into clinical workflow language before being shown to the user.

## Recommended Term Mapping

| Internal / developer term | UI wording |
|---|---|
| Review | 撮影セット確認 |
| Group / Photo Group | 撮影セット |
| Pending | 確認待ち |
| Approved | 確認済み |
| Approve | 問題なし・次の撮影セットへ |
| Save review | 一時保存 |
| Needs review | 確認が必要です |
| Patient ID | 患者番号 |
| Doctor | 担当医 |
| Photographer | 撮影者 |
| Export | 整理済みデータ保存 |
| Export ready | 保存準備完了 |
| Exported | 保存済み |
| Unknown patient | 患者番号未確認 |
| Missing barcode | QR/バーコード未撮影または読取不可 |

## Button Wording Rules

Buttons should describe the user's action or decision, not the internal process.

### Good button labels

- 問題なし・次の撮影セットへ
- ここまで確認して一時保存
- 別の撮影セットに移動
- 患者番号を修正
- 撮影セットを確認する
- 整理済みデータとして保存

### Avoid button labels

- Approve
- Submit
- Save Review
- Update Metadata
- Change Status
- Execute Export

## Review Screen Contract

### Screen name

撮影セット確認

### User role

A clinical reviewer who confirms whether a shooting set contains only photos from the same patient.

### User goal

Confirm that the shooting set does not contain photos from another patient.

### Completion condition

The reviewer has checked the shooting set and either:

- confirms it as no issue, or
- marks/corrects it as requiring attention.

### Must show

- patient number or patient number candidate
- shooting date
- doctor
- photographer
- shooting protocol when available
- number of photos in the shooting set
- thumbnails of all photos in the shooting set
- enlarged preview of the selected photo
- clear warning if QR/barcode is missing or unreadable
- clear warning if the photo count is unexpected
- clear warning if possible mixed-patient photos are suspected

### Must not show prominently

- UUID
- raw database IDs
- raw review_status values
- raw export_status values
- implementation terms such as photo_group

If technical identifiers are needed for debugging, they should be hidden behind a developer/debug view, not shown in the normal clinical UI.

## Shooting Protocol UI

When shooting protocol is available, it should be shown as a clinical assumption for the current set.

Examples:

- 撮影方式：5枚法
- 撮影方式：9枚法
- 撮影方式：14枚法
- 撮影方式：部分撮影
- 撮影方式：その他

The UI should use the selected shooting protocol to explain expected photo count and warnings.

Examples:

- 5枚法として確認中
- 期待枚数：5枚
- 現在枚数：6枚
- 期待枚数と異なるため確認が必要です

## Warning Message Rules

Warnings should be clear, actionable, and not blame the user.

### Good examples

- QR/バーコードが読み取れませんでした。患者番号を確認してください。
- 5枚法としては写真枚数が一致しません。撮影セット内の写真を確認してください。
- この写真は他の写真と特徴が異なる可能性があります。別患者の写真が混ざっていないか確認してください。

### Avoid examples

- Invalid group
- Low confidence
- Failed detection
- Error in metadata
- Outlier detected

Internal confidence scores may be stored, but the UI should explain what the user should check.

## Page Structure Principles

The Review screen should follow the user's workflow:

1. Select a shooting set waiting for confirmation.
2. Check patient information.
3. Check all photos in the shooting set.
4. Confirm that no other patient's photos are mixed in.
5. Save temporarily or move to the next shooting set.

The UI should not be structured primarily around database tables.

## AI Explanation Principle

The UI may mention AI, but should not make AI the main actor.

Preferred framing:

- AIが仮にまとめた撮影セットです
- 確認が必要な可能性があります
- 最終確認は人間が行います

Avoid framing:

- AI approved this group
- AI identified the patient
- AI confirmed the set

The system must not imply that AI has made a final clinical or patient-identification decision.

## Safety Principle

The UI should always reinforce that final confirmation is performed by a human reviewer.

The software supports confirmation, but does not replace it.

## Checklist Before Adding New UI Text

Before adding new labels, buttons, headings, or warning messages, check the following:

1. Is this phrase understandable to a dentist or dental hygienist?
2. Does this phrase describe the user's task rather than the database operation?
3. Does this phrase avoid raw internal terms such as group, pending, status, or UUID?
4. Does this phrase make clear what the user should do next?
5. Does this phrase avoid implying that AI has made a final decision?

If any answer is no, rewrite the phrase in clinical workflow language.

## Design Direction

DentalPhotoOrganizer should prioritize workflow clarity over feature density.

The software is not primarily a general image viewer.

It is a safety-oriented workflow tool for:

- importing dental clinical photos
- creating provisional shooting sets
- detecting cases requiring attention
- supporting human confirmation
- exporting only confirmed data

All UI decisions should support this direction.
