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

---

## 確認待ち

UI term:
確認待ち

Internal term:
pending_review

Meaning:
人間による写真確認がまだ完了していない状態。
通常の作業フローにおいて、次に写真確認を行うべき患者写真セットを指す。

Important notes:
確認待ちはエラーではない。
確認待ちの患者写真セットは、書き出しできない。
写真確認を行い、確認完了にすることで確認済みになる。

Do not confuse with:

- 要修正
- 要整理写真
- 書き出し待ち

---

## 確認済み

UI term:
確認済み

Internal term:
reviewed / approved

Meaning:
人間が写真確認を完了した状態。
患者写真セット内の写真、患者ID、担当医、撮影者などを確認し、書き出し可能な状態として扱われる。

Important notes:
確認済みは「絶対に誤りがない」ことを意味しない。
確認済みであっても、書き出し前に誤りが見つかれば修正できる必要がある。
確認済みの患者写真セットのみ、書き出し対象にできる。

Do not confuse with:

- 書き出し済み
- 最終的な法的承認
- 原本画像の確定保存

---

## 要修正

UI term:
要修正

Internal term:
needs_fix / needs_correction

Meaning:
患者写真セットまたは関連メタデータに問題があり、確認完了や書き出しに進めない状態。
別患者混入、患者ID不明、担当医・撮影者情報の不足、写真の割り当て誤りなどが含まれる。

Important notes:
要修正は、単なる確認待ちよりも強い状態である。
ユーザーに修正が必要であることを明確に伝える。
可能であれば、何を修正すべきかを画面上で示す。

Do not confuse with:

- 確認待ち
- 要整理写真
- 低信頼の自動分類結果

---

## 確認完了

UI term:
確認完了

Internal term:
approve / approval

Meaning:
ユーザーが患者写真セットの写真確認を終え、この患者写真セットを確認済みとして扱う操作。

Important notes:
確認完了は、内部的には承認処理として扱う。
ただし、UI上では原則として「承認」ではなく「確認完了」を使う。
確認完了後も、書き出し前に誤りが見つかれば修正できる。
確認完了は、書き出しそのものではない。

Do not confuse with:

- 書き出し
- 最終的な法的承認
- 絶対に誤りがないことの保証

---

## 原本画像

UI term:
原本画像

Internal term:
original image / source image

Meaning:
カメラ、SDカード、またはユーザーが指定した取り込み元フォルダに存在する元の画像ファイル。

Important notes:
DentalPhotoOrganizerは原本画像を変更、削除、上書きしない。
原本画像は、後から検証できるように保存される必要がある。
原本画像は、書き出し済み画像、サムネイル、アプリ内部の管理レコードとは区別する。

Do not confuse with:

- 取り込んだ写真
- 書き出し済み画像
- サムネイル
- 患者写真セット

---

## 取り込んだ写真

UI term:
取り込んだ写真

Internal term:
imported photo / photo record

Meaning:
DentalPhotoOrganizerが管理対象として登録した写真。
アプリ上で写真確認、整理、書き出しの対象として扱われる写真を指す。

Important notes:
取り込んだ写真は、原本画像そのものを移動・変更したという意味ではない。
「取り込み」は、アプリが写真を管理対象として認識・登録したことを意味する。
原本画像の保存場所や内容は変更しない。

Avoid:

- 取込画像

Do not confuse with:

- 原本画像
- 書き出し済み画像
- サムネイル
- 患者写真セット

---

## 別患者混入

UI term:
別患者混入

Internal term:
mixed-patient photo / patient mix-up

Meaning:
患者写真セットの中に、別の患者さんの写真が含まれている状態。

Important notes:
別患者混入は、このソフトで最も避けるべき重大な問題の一つである。
別患者混入が疑われる場合、その患者写真セットを確認済みにしてはいけない。
発見された場合は、写真の移動、分離、新しい患者写真セットの作成などにより修正する必要がある。

Do not confuse with:

- 要整理写真
- 要修正
- 低信頼の自動分類結果
- 書き出し対象外

---

## 書き出し対象外

UI term:
書き出し対象外

Internal term:
excluded_from_export / export_excluded

Meaning:
人間が確認した結果、患者写真セットとして書き出し経路に乗せないと判断された写真または患者写真セット。
テスト撮影、ピンぼけ、誤撮影、受付表のみの写真、整理には不要な画像などが含まれる。

Important notes:
書き出し対象外は、削除を意味しない。
原本画像は変更・削除されない。
書き出し対象外は、整理していない写真ではなく、確認した結果として書き出さない判断をした状態である。
必要に応じて、後から再確認して書き出し対象に戻せる余地を残す。

Do not confuse with:

- 要整理写真
- 削除対象写真
- 原本画像の削除
- エラー写真

---

## 患者ID

UI term:
患者ID

Internal term:
patient_id / patient identifier

Meaning:
患者を識別するための院内ID。
患者写真セット、写真確認、検索、書き出し先の整理に使用される。

Important notes:
患者IDは患者名とは異なる。
患者IDは、写真を患者単位で整理・検索するための主要な識別情報である。
原則として、患者IDを原本画像のファイル名に埋め込まない。
患者IDが不明または不確実な場合は、確認待ちまたは要修正として扱う。

Do not confuse with:

- 患者名
- 撮影者
- 担当医
- 書き出し済みフォルダ名のみ

---

## 担当医

UI term:
担当医

Internal term:
attending doctor / doctor_in_charge

Meaning:
その患者、症例、または写真管理上の責任を持つ歯科医師。
写真確認、検索、研究利用、症例整理のために記録される。

Important notes:
担当医は、実際に写真を撮影した人とは限らない。
担当医は撮影者と区別する。
患者写真セットごとに担当医を記録できる必要がある。
担当医が不明な場合は、未入力または要修正として扱う。

Do not confuse with:

- 撮影者
- 写真確認を行った人
- 書き出しを実行した人
- ログインユーザー

---

## 撮影者

UI term:
撮影者

Internal term:
operator / photographer

Meaning:
実際に口腔内写真を撮影した人。
歯科医師、歯科衛生士、学生、スタッフなどが該当する。

Important notes:
撮影者は担当医と異なる場合がある。
撮影者は、写真の由来や撮影責任を追跡するために記録する。
撮影者が不明な場合は、未入力または要修正として扱う。
撮影者は、写真確認を行った人や書き出しを実行した人とは区別する。

Do not confuse with:

- 担当医
- 写真確認を行った人
- 書き出しを実行した人
- ログインユーザー

---

## 操作履歴

UI term:
操作履歴

Internal term:
activity history / operation history

Meaning:
ユーザーが行った主要な操作の記録。
写真確認、確認完了、修正、書き出し、書き出し対象外への変更などを含む。

Important notes:
操作履歴は、現場ユーザーが「誰が何をしたか」を確認するための履歴である。
必ずしもすべての内部処理やシステムイベントを含むわけではない。
操作履歴は、ユーザーに分かりやすい表示形式であることが望ましい。

Do not confuse with:

- 監査ログ
- デバッグログ
- エラーログ

---

## 監査ログ

UI term:
監査ログ

Internal term:
audit log

Meaning:
後から検証するために保存される操作記録。
誰が、いつ、どの患者写真セットまたは写真に対して、どのような操作を行ったかを追跡するための記録。

Important notes:
監査ログは、単なるデバッグログではない。
医療データの安全性、追跡性、説明責任を担保するために保存する。
原則として、後から簡単に編集・削除できない設計が望ましい。
監査ログは、ユーザー向けに常に表示される必要はないが、必要時に検証できる必要がある。

Do not confuse with:

- 操作履歴
- デバッグログ
- 一時的な画面表示
