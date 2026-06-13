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

Do not confuse with:

- 患者フォルダ
- 書き出し済みフォルダ
- 原本画像の保存場所

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
書き出し前に最終確認を行い、必要があれば写真確認に戻れる必要がある。

Do not confuse with:

- 原本画像の保存
- 取込
- 写真確認
