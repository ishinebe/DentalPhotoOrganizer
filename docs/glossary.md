# DentalPhotoOrganizer Glossary

This document defines key terms used in DentalPhotoOrganizer.

The purpose of this glossary is to prevent misunderstanding by AI coding agents, developers, and future maintainers.

Each term may have:

- UI term: the word shown to users
- Internal term: the word used in code or technical documentation
- Meaning: the intended definition
- Important notes: what must not be misunderstood

---

## 患者写真セット

UI term:
患者写真セット

Internal term:
photo set / photo group

Meaning:
同じ患者さんの写真としてまとめられた候補。
QRコード、バーコード、撮影順、撮影時刻、将来的なAI分類などにより作成される。

Important notes:
患者写真セットは確定情報ではない。
人間による写真確認が完了するまでは、仮のまとまりとして扱う。

UI wording note:
内部用語としては「患者写真セット」を使用する。
ただし、画面上で操作対象が明確な場合は「患者」「この患者の写真」「患者ごとの写真」を優先する。
UIでは「患者セット」「撮影セット」「統合先撮影セット」という表現を避ける。

Do not confuse with:

- 患者フォルダ
- 書き出し済みフォルダ
- 原本画像の保存場所

---

## 患者情報・写真確認

UI term:
患者情報・写真確認

Internal term:
review / patient information and photo review

Meaning:
患者ID、撮影日、担当医、撮影者、撮影方法、写真タイプなどの情報登録・修正と、別患者写真の混入確認を行う画面または作業。

Important notes:
この画面は単なる写真プレビューや確認だけではない。
ユーザーはこの画面で、患者情報登録、撮影情報登録、写真タイプ修正、混入確認、確認完了を行う。
そのため、ユーザー向けの画面名では「写真確認」単独よりも「患者情報・写真確認」を優先する。
ボタンや短い導線では、文脈に応じて「患者情報を開く」を使ってよい。

Do not confuse with:

- 単なる画像プレビュー
- 書き出し
- Search結果の閲覧

---

## 写真確認

UI term:
写真確認

Internal term:
review

Meaning:
患者写真セットに別患者の写真が混ざっていないか、患者ID、担当医、撮影者などの情報が正しいかを人間が確認する作業。

Important notes:
写真確認は書き出し前に必須である。
AIや自動分類の結果だけで写真確認を完了扱いにしてはいけない。
画面名としては「写真確認」単独だと情報登録の役割が伝わりにくい場合があるため、「患者情報・写真確認」を優先する。

Do not confuse with:

- 自動分類
- 書き出し
- 単なるプレビュー表示

---

## 書き出し

UI term:
書き出し

Internal term:
export

Meaning:
写真確認が完了した患者写真セットを、整理済みの患者フォルダとして出力する作業。

Important notes:
書き出しは確認済みの患者写真セットに対してのみ実行できる。
書き出しは原本画像を変更しない。
書き出し前に最終確認を行い、必要があれば患者情報・写真確認に戻れる必要がある。
UIでは「書き出し対象の患者」のような硬い名詞句より、「書き出す患者を選ぶ」のようにユーザーの行動が分かる表現を優先する。

Do not confuse with:

- 原本画像の保存
- 取込
- 写真確認

---

## UI wording notes

Preferred user-facing wording:

- 患者情報・写真確認: main screen name for the review screen when it includes patient metadata registration and photo verification.
- 患者情報を開く: short action label when opening a patient photo set from Search or another screen.
- 書き出す患者を選ぶ: preferred heading for choosing patients to export.
- 確認完了: preferred action label instead of 承認.
- 書き出し: preferred term instead of エクスポート.

Avoid user-facing wording:

- 患者セット
- 撮影セット
- 統合先撮影セット
- 書き出し対象の患者, when a more action-oriented label such as 書き出す患者を選ぶ is clearer.
- 承認, unless describing internal implementation.
- レビュー, unless describing internal implementation.

---

## 要整理写真

UI term:
要整理写真

Internal term:
unorganized photo / needs-organization photo

Meaning:
まだ患者写真セットとして整理できていない写真。
QRコード、バーコード、撮影順、撮影時刻などから患者写真セット候補を十分に作れなかった写真、または人間による整理が必要な写真を指す。

Important notes:
要整理写真は、不要写真、削除対象、エラー写真という意味ではない。
また、必ずどこかの既存患者写真セットに所属させる必要がある、という意味でもない。
人間が確認し、患者写真セットを新規作成する、既存の患者写真セットに含める、または整理対象外として扱う。

Avoid:

- 未所属写真
- unassigned photo

Do not confuse with:

- 削除対象写真
- 不要写真
- 別患者混入
- 確認待ちの患者写真セット
