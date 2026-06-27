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

---

## 自動分類

UI term:
自動分類

Internal term:
automatic classification / auto-classification

Meaning:
QRコード、バーコード、撮影順、撮影時刻、将来的なAI判定などを用いて、写真を患者写真セット候補に分類する処理。

Important notes:
自動分類は補助機能であり、最終判断ではない。
自動分類の結果だけで患者写真セットを確認済みにしてはいけない。
自動分類結果は、人間による写真確認の対象になる。
自動分類の結果には分類信頼度を表示できることが望ましい。

Do not confuse with:

- 写真確認
- 確認完了
- 書き出し
- 最終的な患者写真セットの確定

---

## 分類信頼度

UI term:
分類信頼度

Internal term:
classification_confidence / confidence_level

Meaning:
自動分類の結果がどの程度信頼できるかを示す指標。
患者写真セット候補が正しい可能性を表す補助情報として扱う。

Possible UI values:

- 分類信頼度：高
- 分類信頼度：中
- 分類信頼度：低

Important notes:
分類信頼度は、正解を保証するものではない。
分類信頼度が高くても、人間による写真確認は必須である。
分類信頼度が低い場合は、特に注意して写真確認を行う必要がある。
分類信頼度は、患者写真セットを確認済みにするための条件ではなく、写真確認を支援するための情報である。

Avoid:

- 判定精度
- 低信頼

Do not confuse with:

- 写真確認の完了状態
- 確認済み
- 要修正
- モデル全体の精度評価

---

## 書き出し済み

UI term:
書き出し済み

Internal term:
exported / export_completed

Meaning:
確認済みの患者写真セットについて、書き出し処理が完了した状態。
整理済みの患者フォルダまたは指定された出力先に、写真が出力されたことを示す。

Important notes:
書き出し済みは、写真確認が完了したことだけを意味するものではない。
書き出し済みは、実際に書き出し処理が完了した状態を指す。
書き出し済みであっても、原本画像は変更・削除されない。
書き出し後に誤りが見つかった場合は、修正後に再書き出しが必要になる可能性がある。
書き出し済み状態は、書き出し履歴または監査ログと対応して追跡できる必要がある。

Do not confuse with:

- 確認済み
- 確認完了
- 書き出し対象外
- 原本画像の保存

---

## ログインユーザー

UI term:
ログインユーザー

Internal term:
logged_in_user / current_user

Meaning:
DentalPhotoOrganizerを操作している現在のユーザー。
写真確認、確認完了、修正、書き出しなどの操作を行う主体として扱われる。

Important notes:
ログインユーザーは、担当医や撮影者と同じとは限らない。
ログインユーザーは、操作履歴や監査ログに記録される主体である。
ログインユーザーがどの操作を行ったかを後から追跡できる必要がある。

Do not confuse with:

- 担当医
- 撮影者
- 写真確認者
- 書き出し実行者

---

## 写真確認者

UI term:
写真確認者

Internal term:
reviewer / reviewed_by

Meaning:
患者写真セットの写真確認を実際に行い、確認完了にしたユーザー。
患者写真セットに別患者混入がないか、患者ID、担当医、撮影者などが適切かを確認した人を指す。

Important notes:
写真確認者は、担当医や撮影者と同じとは限らない。
写真確認者は、確認完了の操作とともに記録される必要がある。
写真確認者は、操作履歴や監査ログで追跡できる必要がある。
写真確認者は、書き出し実行者と同じとは限らない。

Do not confuse with:

- 担当医
- 撮影者
- ログインユーザー全般
- 書き出し実行者

---

## 書き出し実行者

UI term:
書き出し実行者

Internal term:
exporter / exported_by

Meaning:
書き出し処理を実際に実行したユーザー。
確認済みの患者写真セットを、整理済みの患者フォルダまたは指定された出力先に書き出した人を指す。

Important notes:
書き出し実行者は、担当医、撮影者、写真確認者と同じとは限らない。
書き出し実行者は、書き出し済み状態や書き出し履歴と対応して記録される必要がある。
書き出し実行者は、操作履歴や監査ログで追跡できる必要がある。
書き出し実行者は、書き出し前の写真確認を行った人とは別であってもよい。

Do not confuse with:

- 担当医
- 撮影者
- 写真確認者
- ログインユーザー全般

---

## 書き出し先

UI term:
書き出し先

Internal term:
export_destination / output_destination

Meaning:
書き出し処理で写真を出力する先として、ユーザーが指定するフォルダまたは場所。

Important notes:
書き出し先は、原本画像の保存場所とは異なる。
書き出し先に出力される写真は、確認済みの患者写真セットに基づく。
書き出し先は、書き出し処理の実行前にユーザーが確認できる必要がある。

Do not confuse with:

- 原本画像の保存場所
- 患者フォルダ
- 書き出し済みフォルダ
- アプリ内部の管理場所

---

## 患者フォルダ

UI term:
患者フォルダ

Internal term:
patient folder / patient_directory

Meaning:
患者IDなどに基づいて作成または使用される、患者単位の写真整理フォルダ。
書き出し時に、確認済みの患者写真セットを整理して保存するために使用される。

Important notes:
患者フォルダは、患者写真セットそのものではない。
患者フォルダは、書き出し先の中に作成される場合がある。
患者フォルダ名の仕様は、患者IDや撮影日などの運用ルールに従う。
患者フォルダに写真が存在しても、それだけで写真確認済みであることを意味しない。

Do not confuse with:

- 患者写真セット
- 原本画像の保存場所
- 書き出し先
- 書き出し済み状態

---

## 書き出し済みフォルダ

UI term:
書き出し済みフォルダ

Internal term:
exported folder / exported_directory

Meaning:
書き出し処理によって実際に作成または更新されたフォルダ。
確認済みの患者写真セットが、整理済みの形で出力された結果を指す。

Important notes:
書き出し済みフォルダは、書き出し処理の結果であり、原本画像の保存場所ではない。
書き出し済みフォルダ内の写真に誤りが見つかった場合は、元の患者写真セットを修正し、必要に応じて再書き出しを行う。
書き出し済みフォルダの存在だけで、最新の確認状態や最新の書き出し状態を保証するわけではない。
書き出し済みフォルダは、書き出し履歴や監査ログと対応して追跡できる必要がある。

Do not confuse with:

- 原本画像の保存場所
- 患者写真セット
- 書き出し先
- 確認済み

---

## QRコード

UI term:
QRコード

Internal term:
qr_code / detected_qr_code

Meaning:
患者IDや撮影区切りなど、写真整理に利用できる情報を含む二次元コード。
写真内に写っているQRコードを検出することで、患者写真セット候補の作成や患者ID推定に利用する。

Important notes:
QRコードは自動分類の補助情報であり、最終判断ではない。
QRコードが検出された場合でも、人間による写真確認は必須である。
QRコードが検出できない場合でも、写真が無効になるわけではない。
QRコードの読み取り結果が不確実な場合は、分類信頼度を下げる、または要整理写真として扱う。

Do not confuse with:

- バーコード
- 患者IDそのもの
- 写真確認の完了
- 確認済み状態

---

## バーコード

UI term:
バーコード

Internal term:
barcode / detected_barcode

Meaning:
患者IDや受付情報など、写真整理に利用できる情報を含む一次元コード。
写真内に写っているバーコードを検出することで、患者写真セット候補の作成や患者ID推定に利用する。

Important notes:
バーコードは自動分類の補助情報であり、最終判断ではない。
バーコードが検出された場合でも、人間による写真確認は必須である。
バーコードが検出できない場合でも、写真が無効になるわけではない。
バーコードの読み取り結果が不確実な場合は、分類信頼度を下げる、または要整理写真として扱う。

Do not confuse with:

- QRコード
- 患者IDそのもの
- 写真確認の完了
- 確認済み状態

---

## 受付表

UI term:
受付表

Internal term:
reception sheet / patient reception sheet

Meaning:
患者IDや受付情報などが記載された紙または表示物。
口腔内写真撮影の前後に撮影されることで、患者写真セット候補の区切りや患者ID推定に利用される。

Important notes:
受付表は、患者写真セットを作成するための重要な手がかりである。
受付表が撮影されていない場合でも、写真整理を完全に停止してはいけない。
受付表がない場合は、撮影順、撮影時刻、QRコード、バーコード、将来的なAI判定などを補助情報として扱う。
受付表そのものの写真は、通常の口腔内写真とは区別して扱う必要がある。
受付表写真を患者写真セットに含めるか、書き出し対象外にするかは運用ルールに従う。

Do not confuse with:

- 口腔内写真
- 患者写真セット
- 患者IDそのもの
- 書き出し済みフォルダ

---

## 写真タイプ

UI term:
写真タイプ

Internal term:
photo_type / image_type

Meaning:
写真がどの種類の撮影内容に該当するかを示す分類。
例として、正面観、側方面観、咬合面観、口腔内規格写真、受付表写真などが含まれる。

Important notes:
写真タイプは、患者写真セットの completeness check や写真確認の補助に利用される。
写真タイプは、自動分類によって推定される場合があるが、最終判断ではない。
写真タイプが不明または不確実な場合は、人間による写真確認の対象になる。
写真タイプは、患者ID、担当医、撮影者とは異なるメタデータである。

Do not confuse with:

- 患者写真セット
- 患者ID
- 自動分類そのもの
- 分類信頼度

---

## 口腔内写真

UI term:
口腔内写真

Internal term:
intraoral photo / intraoral image

Meaning:
患者の口腔内を撮影した臨床写真。
DentalPhotoOrganizerで主に整理・確認・書き出しの対象となる写真である。

Important notes:
口腔内写真は、受付表写真やテスト撮影とは区別して扱う。
口腔内写真であっても、患者写真セット内に別患者混入がないか写真確認が必要である。
口腔内写真の写真タイプは、写真確認や completeness check の補助情報として扱う。

Do not confuse with:

- 受付表
- サムネイル
- 原本画像
- 書き出し済み画像

---

## サムネイル

UI term:
サムネイル

Internal term:
thumbnail / preview image

Meaning:
写真確認や一覧表示のために縮小表示される画像。
ユーザーが患者写真セットの内容を素早く確認するために使用する。

Important notes:
サムネイルは原本画像そのものではない。
サムネイル表示のために原本画像を変更してはいけない。
サムネイルは、写真確認や書き出し前確認を支援するための表示である。
サムネイルだけで最終判断するのではなく、必要に応じて大きな画像表示で確認できる必要がある。

Do not confuse with:

- 原本画像
- 取り込んだ写真
- 書き出し済み画像
- 写真タイプ

---

## 撮影日

UI term:
撮影日

Internal term:
taken_date / captured_date / shooting_date

Meaning:
写真が撮影された日付。
患者写真セットの検索、整理、書き出し、患者フォルダ名の作成などに利用される。

Important notes:
撮影日は、写真の取り込み日とは異なる場合がある。
撮影日は、ファイルの作成日時、Exif情報、受付表情報、ユーザー入力などから推定または入力される場合がある。
撮影日が不明または不確実な場合は、確認待ちまたは要修正として扱う。
撮影日は、患者ID、担当医、撮影者とともに検索軸として重要である。

Do not confuse with:

- 取り込み日
- 書き出し日
- 写真確認日
- ファイル更新日

---

## 患者情報・写真確認

UI term:
患者情報・写真確認

Internal term:
review screen / patient metadata and photo review

Meaning:
review画面のユーザー向け画面名として優先する表現。
患者ID、撮影日、担当医、撮影者、撮影方法、写真タイプなどの情報登録・修正と、別患者混入確認を行う画面を指す。

Important notes:
短いボタンでは「患者情報を開く」を使ってよい。
作業内容としての写真確認だけでなく、患者情報や撮影情報の登録・修正も行う画面であることが伝わるようにする。

Do not confuse with:

- 写真確認という作業そのもの
- 書き出し
- 検索結果の詳細表示

---

## 患者情報・写真確認の画面名

UI term:
患者情報・写真確認

Internal term:
review task / photo review

Meaning:
作業内容としての写真確認は引き続き使ってよい。
ただし画面名としては、情報登録の役割も伝わる「患者情報・写真確認」を使う。

Important notes:
ユーザーが患者情報の登録・修正も行う導線では「患者情報・写真確認」を優先する。
単に写真の混入や分類を確認する作業説明では「写真確認」を使ってよい。

Do not confuse with:

- 患者情報・写真確認という画面名
- 確認完了
- 書き出し

---

## 書き出しの行動表現

UI term:
書き出し

Internal term:
export wording

Meaning:
書き出し画面や書き出し操作では、「書き出す患者を選ぶ」のように、ユーザーの行動が分かる表現を優先する。

Important notes:
画面見出しやボタンでは、ユーザーが次に何をするのかが分かる表現を使う。
内部用語や状態名をそのまま画面に出さない。

Do not confuse with:

- エクスポート
- 書き出し済み
- 書き出し先
