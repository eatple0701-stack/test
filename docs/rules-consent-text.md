# 동의 문구 — 승인본

**약관·개인정보 담당자에게 넘기는 자료입니다.** 앱이 동의를 받는 화면에 실제로
뜨는 글자 전부이고, 여기 적힌 것이 승인된 것입니다.

이 파일은 **코드에서 뽑아낸 것이 아니라 승인 시점에 손으로 옮겨 적은 것**입니다.
`node scripts/audit-consent-text.mjs`가 `src/content/safety.js`의 문자열과 이
파일을 **한 글자씩** 대조합니다. 정규화하지 않습니다 — 아랍어 모음 부호처럼
빠지면 뜻이 갈리는 문자가 있어서, 부호를 지우고 비교하면 사고를 못 잡습니다.

작성 2026-09-03. 8개 문안 × 7개 언어 = **56줄**.

---

## 누가 어디서 보나

동의 게이트(`RulesConsent`)는 **두 곳**에 뜨고, 둘 다 처음 한 번만입니다.
게스트가 자리를 먼저 청하면 거기서 동의하고 나중에 밥상을 열 땐 안 뜹니다.
반대도 같습니다.

| 화면 | 누가 | 버튼 |
|---|---|---|
| `TableCreate.jsx` | 호스트, 첫 밥상을 열기 전 | `open-table` |
| `TableDetail.jsx` | 게스트, 첫 자리를 요청하기 전 | `ask-seat` |

`PURPOSE.rule`은 게스트의 자리 요청 블록(`TableDetail`)과 안전 시트
(`SafetySheet`)에, `PURPOSE.ifBroken`은 안전 시트에 뜹니다.

## 각 줄이 약속하는 것

| | 약속 |
|---|---|
| 1 | 이 만남의 성격은 식사이고, 자리를 얻었다는 사실이 상대에게 만남을 청할 기회를 주지 않는다 |
| 2 | 동석자가 못 먹는 것을 호스트에게 알렸을 수 있으며, 그것은 가볍게 다룰 일이 아니다 |
| 3 | 언제든 자리를 떠날 권리가 있고, 설명할 의무는 없다 |
| 4 | 차단할 수 있고, 팀에 알릴 수 있다 — 둘 다 **할 수 있다**이지 팀이 무엇을 하겠다는 약속은 아니다 |
| rule | ① 혼자보다 같이 먹고 싶은 요리가 있는 사람을 앉힌다 ② 데이팅 앱이 아니다 ③ 자리가 데이트를 청할 기회가 아니다 |
| ifBroken | ① 떠날 수 있다 ② 사후에 팀에 알릴 수 있다 ③ 불편하게 한 호스트는 다음 밥상을 **열지 말아야 한다** |

**약관 문서가 나오면 이 표와 대조해 주세요.** 특히 4번과 ifBroken ③은 앱이
집행하지 않는 것을 집행한다고 읽히기 쉬운 자리입니다. 앱에는 모더레이션 큐가
없고 신고 경로는 사람이 지켜보는 오픈채팅방 하나입니다(`NOT_YET_BUILT`,
`REPORT_CHANNEL`).

## 기록해 둘 것 셋

**ko·ja는 긍정 비교형, 나머지 다섯은 부정형입니다.** 영어 `a dish they'd rather
not eat alone`은 부정이고 en·es·fr·ar·zh가 그것을 따르는데, ko는 「혼자보다 같이
먹고 싶은」, ja는 「ひとりより誰かと食べたい」로 긍정 비교입니다. **의도된 것이며
한국어를 먼저 정한 결과입니다.** 드리프트가 아니니 고치지 마세요.

**ifBroken 마지막 문장은 규범이지 집행이 아닙니다.** 앱은 호스트를 막지 않습니다.
팀이 실제로 막기로 하면 순서는 **기능 먼저, 문구 나중**입니다. 기능 없이
「안 됩니다」로 올리면 없는 것을 약속하게 됩니다. 한국어는 2026-09-03까지
「열어서는 안 됩니다」였는데, 그것은 must not에 해당해 영어 should not보다 한 단
위였습니다. 사다리를 만들기 전에 승인된 문장이었습니다.

**한국어가 잠깐 다른 언어의 기준 노릇을 했습니다.** 스페인어 `no debería`를
`no debe`로 올리자는 제안이 「한국어 열어서는 안 됩니다와 같은 높이」를 근거로
나왔는데, 그 한국어 자체가 한 단 위였습니다. **모든 언어는 영어 원문에 맞춥니다.**
서로 다른 언어를 보고 맞추기 시작하면 일곱 개가 조금씩 어긋납니다.

---

## RULES[0]

```text
en: This is a meal, not a date. A seat at a table is not an opening to ask somebody out.
ko: 이 자리는 식사이지 데이트가 아닙니다. 밥상에 앉는 것은 누군가에게 데이트를 청할 기회가 아닙니다.
es: Esto es una comida, no una cita. Un sitio en una mesa no da pie a invitar a salir a nadie.
fr: Il s'agit d'un repas, pas d'un rendez-vous galant. Une place à table n'est pas une occasion d'inviter quelqu'un à sortir.
ar: هذه وجبة لا موعد غرامي. والمقعد على المائدة ليس فرصة لدعوة أحد إلى موعد غرامي.
zh: 这是一顿饭，不是约会。坐到一张饭桌上，不是约人出去的机会。
ja: これは食事の場であって、デートではありません。食卓に着くことは、誰かをデートに誘うきっかけではありません。
```

두 번째 문장은 `PURPOSE.rule`의 마지막 절과 **같은 문자열**입니다. 코드에서는
`NOT_AN_OPENING` 상수 하나를 두 곳이 읽습니다.

## RULES[1]

```text
en: People at your table may have told the host what they cannot eat. Take it seriously.
ko: 같은 밥상의 사람들이 못 먹는 것을 호스트에게 미리 알렸을 수 있습니다. 진지하게 받아들이세요.
es: Puede que las personas de tu mesa le hayan dicho al anfitrión lo que no pueden comer. Tómatelo en serio.
fr: Les gens à votre table ont peut-être dit à l'hôte ce qu'ils ne peuvent pas manger. Prenez-le au sérieux.
ar: من يشاركونك المائدة ربّما أخبروا المضيف بما لا يستطيعون أكله. خذ ذلك على محمل الجدّ.
zh: 同桌的人可能已经把自己不能吃的东西告诉了主人。请认真对待。
ja: 同じ食卓の人が、食べられないものをホストに伝えているかもしれません。真剣に受け止めてください。
```

「알렸을 수 있습니다」이지 「알렸습니다」가 아닙니다. 한국어의 「미리」는 영어에
대응어가 없지만, 영어 `told the host`는 청자가 독자가 아니라 호스트라 이미 지난
별개의 행위임이 함축됩니다. 한국어는 그것을 보상합니다.

## RULES[2]

```text
en: You can leave any meal at any point, and you owe nobody an explanation.
ko: 어느 식사든 언제든 떠날 수 있고, 누구에게도 이유를 설명할 의무가 없습니다.
es: Puedes irte de cualquier comida en cualquier momento, y no le debes explicaciones a nadie.
fr: Vous pouvez quitter n'importe quel repas à n'importe quel moment, et vous ne devez d'explication à personne.
ar: تستطيع مغادرة أي وجبة في أي لحظة، ولست مدينًا لأحد بتفسير.
zh: 任何一顿饭，你随时都可以离席，也不欠任何人一个解释。
ja: どの食事でも、いつでも席を立って構いません。誰にも理由を説明する義務はありません。
```

영어 `owe`는 없는 **빚**이지 건너뛸 수 있는 **절차**가 아닙니다. 중국어는
`不必`(할 필요 없다), 일본어는 `必要はありません`이었는데 둘 다 의무 쪽 말로
옮겼습니다 — `不欠`, `義務`.

## RULES[3]

```text
en: If somebody makes you uncomfortable you can block them, and you can tell the team.
ko: 누군가 불편하게 하면 그 사람을 차단할 수 있고, 팀에 알릴 수 있습니다.
es: Si alguien te incomoda, puedes bloquear a esa persona y puedes avisar al equipo.
fr: Si quelqu'un vous met mal à l'aise, vous pouvez le bloquer, et vous pouvez prévenir l'équipe.
ar: إن أشعرك أحد بعدم الارتياح فيمكنك حظره، ويمكنك إخبار الفريق.
zh: 要是有人让你不舒服，你可以拉黑对方，也可以告诉团队。
ja: 誰かに不快な思いをさせられたら、その人をブロックすることも、チームに知らせることもできます。
```

**두 개의 "할 수 있다"이고, 팀이 그 다음에 무엇을 하는지는 한마디도 없습니다.**
프랑스어가 `signaler`(신고)가 아니라 `prévenir`(알리다)인 것도 같은 이유입니다 —
영어가 `report`가 아니라 `tell`입니다.

## PURPOSE.rule

```text
en: Eatple seats people who want to eat a dish they'd rather not eat alone. It is not a dating app. A seat at a table is not an opening to ask somebody out.
ko: 밥친구는 혼자보다 같이 먹고 싶은 요리가 있는 사람들을 한 상에 앉힙니다. 데이팅 앱이 아닙니다. 밥상에 앉는 것은 누군가에게 데이트를 청할 기회가 아닙니다.
es: Eatple sienta a una misma mesa a personas con ganas de un plato que preferirían no comer solas. No es una app de citas. Un sitio en una mesa no da pie a invitar a salir a nadie.
fr: Eatple réunit à une même table des gens qui ont envie d'un plat qu'ils préfèrent ne pas manger seuls. Ce n'est pas une application de rencontres. Une place à table n'est pas une occasion d'inviter quelqu'un à sortir.
ar: يُجلس Eatple إلى مائدة واحدة أشخاصًا لديهم طبق يفضّلون ألّا يأكلوه وحدهم. وهو ليس تطبيق مواعدة. والمقعد على المائدة ليس فرصة لدعوة أحد إلى موعد غرامي.
zh: Eatple 把想吃某道菜、又不想一个人吃的人凑到一桌。这不是约会应用。坐到一张饭桌上，不是约人出去的机会。
ja: Eatple は、ひとりより誰かと食べたい料理がある人たちを、ひとつの食卓に集めます。デートアプリではありません。食卓に着くことは、誰かをデートに誘うきっかけではありません。
```

첫 문장은 **가게가 아니라 사람**에 대한 진술입니다. 이전 문안
(`a dish nobody can order alone` / 「혼자서는 주문할 수 없는」)은 카탈로그 24개 중
**10개에 대해 거짓**이었습니다 — 백반·떡볶이·전·순대·튀김·산낙지·육회·닭발·쌈밥·
비빔밥이 `minPeople: 1`이고 카탈로그 자신이 「이건 혼자서도 시킬 수 있어요」라고
적고 있습니다.

앱 이름은 영어 문장 안에서 **Eatple**, 한국어 안에서 **밥친구**입니다.

## PURPOSE.ifBroken

```text
en: If somebody treats it as one: you can leave, and you can tell the team afterwards. A host who made somebody uncomfortable should not be hosting the next table.
ko: 누군가 그렇게 대한다면: 자리를 떠날 수 있고, 나중에 팀에 알릴 수 있습니다. 누군가를 불편하게 한 호스트는 다음 밥상을 열지 말아야 합니다.
es: Si alguien lo trata como una cita: puedes irte, y puedes avisar al equipo después. Un anfitrión que haya incomodado a alguien no debería abrir la siguiente mesa.
fr: Si quelqu'un en fait un rendez-vous galant : vous pouvez partir, et prévenir l'équipe ensuite. Un hôte qui a mis quelqu'un mal à l'aise ne devrait pas tenir la prochaine table.
ar: إن تعامل أحد مع الأمر على هذا النحو فيمكنك المغادرة، ويمكنك إخبار الفريق بعد ذلك. والمضيف الذي أشعر أحدًا بعدم الارتياح لا ينبغي أن يستضيف المائدة التالية.
zh: 要是有人把这当成约会：你可以离席，事后也可以告诉团队。曾让人不舒服的主人，不该开下一张饭桌。
ja: 誰かがこの場をそう扱ってきたら：席を立つことも、あとでチームに知らせることもできます。誰かに不快な思いをさせたホストは、次の食卓を開くべきではありません。
```

일곱 언어 모두 **"해서는 안 된다"가 아니라 "하지 말아야 한다"** 칸에 있습니다 —
`should not` / `no debería` / `ne devrait pas` / `لا ينبغي` / `不该` /
`べきではありません` / `열지 말아야 합니다`. 한 칸 위는 금지이고, 앱은 금지할
수단이 없습니다.

## 버튼 — 상 차리기 (`open-table`)

```text
en: I agree — open a table
ko: 동의하고 계속 — 상 차리기
es: Acepto — abrir una mesa
fr: J'accepte — ouvrir une table
ar: أوافق — افتح مائدة
zh: 我同意 — 开一张饭桌
ja: 同意します — 食卓を開く
```

## 버튼 — 자리 요청 (`ask-seat`)

```text
en: I agree — ask for a seat
ko: 동의하고 계속 — 자리 요청
es: Acepto — pedir sitio
fr: J'accepte — demander une place
ar: أوافق — اطلب مقعدًا
zh: 我同意 — 申请位子
ja: 同意します — 席をリクエストする
```

버튼은 2026-09-03까지 영어 원문을 번역된 틀에 끼워 넣고 있었습니다 — 한국어
호스트가 「동의하고 계속 — open a table」을 읽었습니다. 이제 `action`은 키이고
문구는 데이터에서 조립됩니다.
