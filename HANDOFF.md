# 밥친구 / Eatple — 인수인계

**HEAD:** `43a28d6` · 2026-08-02 · 워킹트리 깨끗
**테스트:** 200개 전부 통과 (`npm test`, 약 14초)
**배포:** https://test-umber-phi-78.vercel.app

이 문서 하나로 이전 대화를 읽지 않고 이어서 작업할 수 있게 썼습니다.
숫자는 기억이 아니라 위 커밋의 저장소에서 직접 센 것입니다.

이 파일의 이전 버전은 **K-Food Map**이라는 다른 앱의 인수인계 문서였습니다.
그 내용은 옆 저장소(`rkdals0121/kfoodmap`)와 이 저장소의 git 이력
(`git show 31e4b2f:HANDOFF.md`)에 그대로 남아 있습니다.

---

## 0. 먼저 읽어야 할 경고 두 가지

**하나. `README.md`는 이 앱 이야기가 아닙니다.**
아직 **K-Food Map** — 지도 중심 식당 찾기 앱 — 을 설명합니다. 이 저장소는
그 코드베이스에서 갈라져 나왔고 README는 갱신되지 않았습니다. 읽으면 완전히
다른 제품을 이해하게 됩니다. 안 고친 이유는 제품 작업을 우선했기 때문이고,
고치는 것 자체가 아래 4번의 첫 항목입니다.

**둘. 이 폴더에서 `kfoodmap` 저장소로 절대 푸시하지 마세요.**
8월 2일에 실제로 그 일이 일어났고, 남의 라이브 앱이 몇 시간 동안 밥친구를
서빙했습니다. 지금은 원격이 하나뿐이고 pre-push 훅이 막지만, **새로 클론하면
훅을 다시 켜야 합니다:**

```bash
git config core.hooksPath .githooks
```

전말은 `docs/where-this-deploys.md`에 있습니다.

---

## 1. 이 앱이 무엇인가

**"Solo trip, Shared table."** 혼자 한국에 온 외국인 여행자가 한식에서
차단되는 이유는 언어도 가격도 아니고 **1인분이 없다는 것**입니다.
삼겹살은 2인분부터, 감자탕은 냄비 단위, 한정식은 2인 예약.

그래서 이 앱은 식당을 찾아주지 않습니다. **같이 먹을 사람이 있는 상**을
찾아줍니다. 혼자서는 주문 자체가 불가능한 요리를 걸고, 그 상에 자리를
요청하거나 직접 상을 엽니다.

상은 두 종류이고, 라벨은 주장할 수 없게 **파생**됩니다
(`src/domain/catalog/hosts.js`):

- **호스트 테이블** — 호스트가 문화 가이드를 하나 이상 켠 상
- **테이블 메이트** — 그냥 같이 먹는 상

`tableKind()`가 guides 배열에서 계산하므로, 가이드 없이 "호스트 테이블"로
표시되는 일이 구조적으로 불가능합니다.

### 화면 넷

`Explore` / `Tables` / `Places` / `Passport`.
Passport는 프로필과 합쳐져 있고 `/profile`은 별칭으로 남겨뒀습니다.

라우터 라이브러리 없이 History API로 아홉 개 경로를 씁니다 (`src/routes.js`).
`/tables/<id>`가 공유 링크입니다 — **`vercel.json`의 SPA rewrite가 없으면
프로덕션에서만 404가 납니다.** 개발 서버에서는 멀쩡해서 놓치기 쉽습니다.

---

## 2. 30분 안에 돌리기

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local`을 안 채워도 **앱은 돕니다** — localStorage로 떨어져서 한 대
안에서만 공유됩니다. 키가 필요하면 Supabase 대시보드 Project Settings → API에서
가져오고, **`.env.example`의 주석을 꼭 읽으세요.** 대시보드가 키 이름을 바꿔서
`sb_publishable_`(공개, 이게 들어감)과 `sb_secret_`(RLS 우회, **절대 금지**)를
헷갈리기 쉽습니다. `VITE_` 접두사가 붙은 값은 브라우저 번들에 그대로
컴파일됩니다.

새 Supabase 프로젝트에 붙일 때는 **먼저 `supabase/schema.sql`을 돌리세요.**
anon 키가 공개여도 안전한 이유가 RLS이고, 그게 이 파일에 있습니다.

```bash
npm test          # 200개
npm run lint      # oxlint
npm run build
```

**검증은 375×812에서 하세요.** 데스크톱 폭에서 확인하다가 놓친 문제가 실제로
있었습니다.

---

## 3. 이 저장소의 규칙 — 어기면 테스트가 잡습니다

이 프로젝트는 **국고가 들어간 공공외교 사업**이고, 외국인에게 한국에 대해
사실을 가르칩니다. 그래서 정직성 규칙이 문서가 아니라 **테스트로** 박혀
있습니다.

- **가격을 쓰지 않습니다.** 확인할 방법이 없습니다.
- **출처 없는 퀴즈 문제는 여행자에게 도달하지 않습니다.** `quizFor`가
  거릅니다. 파일에는 남고 화면에는 안 나옵니다.
- **샘플 데이터는 샘플이라고 표시**합니다.
- **요리에 대해 식이 판정을 내리지 않습니다.** 비건·할랄은 앱의 판정이 아니라
  **호스트에게 전달되는 메시지**입니다 (`src/data/profile.js`).
- **산문에 등장하는 재료는 `contains`에 선언**되어야 합니다. 빈 `contains`는
  `varies: true`를 함께 선언해야 합니다.

`src/content/sources.js`의 규칙이 특히 중요합니다: **등록된 출처는 전부 직접
열어서 읽은 것**입니다. 제목만 보고 넣지 마세요. 각 항목 주석에 근거가 된
문장이 인용돼 있으니 같은 형식으로 이어가면 됩니다.

이건 장식이 아닙니다. 10개 문제에 출처를 붙이는 과정에서 **앱이 출처보다 많이
말하고 있던 문장 4개**가 나왔습니다 — 12첩을 왕에게만 묶은 것, 고추 전래를
"16세기"로 단정한 것 등. 무엇을 왜 고쳤는지는 `docs/sources-status.md`에
있습니다.

---

## 4. 지금 할 수 있는 일 — 우선순위대로

### ① README.md를 밥친구로 다시 쓰기 · 막힌 것 없음

가장 값싸고 가장 확실한 작업입니다. 지금 이 저장소를 처음 여는 사람은 전부
잘못된 제품을 이해하고 시작합니다. 위 1번 절과 `docs/where-this-deploys.md`가
재료입니다.

`docs/DATA.md`와 `docs/EVIDENCE.md`도 K-Food Map 시절 문서입니다. 다만 이쪽은
`src/data/verification.js`가 아직 살아서 쓰고 있으니 **지우지 말고** 어디까지
유효한지만 확인하세요.

### ② 죽은 파일 정리 · 막힌 것 없음

참조가 0인 K-Food Map 잔재입니다.

| 파일 | 상태 |
| --- | --- |
| `temp.js` | 빈 파일 (0줄) |
| `geocode_and_build.cjs` | 349줄, 참조 0 |
| `verify.cjs` | 25줄, 참조 0 |

`data/evidence/`(2개)는 `verification.js`가 쓰므로 **남겨두세요.**

### ③ 퀴즈 문제 늘리기 · 막힌 것 없음

현재 16문제, 전부 출처 있음. 한 상에서 6문제가 뜨는데 같은 상에 두 번 앉으면
다 본 문제입니다. `src/content/quiz.js` 맨 위 주석의 두 규칙(논쟁적인 것 제외,
reveal이 핵심)을 지키고 `sources.js` 형식대로 출처를 붙이면 됩니다.

### ④ 안전 기능 세 가지 · 서버 작업 필요

`src/content/safety.js`의 `NOT_YET_BUILT`에 이름이 적혀 있습니다. 숨긴 게
아니라 **화면에 "아직 없다"고 표시**하고 있는 항목입니다.

- 차단 (상대가 내 상을 못 보게)
- 당근마켓 매너온도 같은 평판 신호
- 앱 안에서 신고 (지금은 오픈채팅으로 나감)

신고는 `https://open.kakao.com/o/g4hMZTGi`로 갑니다. **파일럿이 도는 동안
사람이 그 방을 봐야 한다는 약속이 코드 주석에 적혀 있습니다.**

---

## 5. 막혀 있는 것 — 사람이 결정해야 진행됨

원격 작업자가 혼자 뚫을 수 없습니다. 손대지 말고 넘기세요.

| 항목 | 필요한 것 | 준비되면 |
| --- | --- | --- |
| 인증 호스트 | 실제 명단 | `host_verified` SQL 생성 |
| 제휴 식당 | 제휴 확정 | 카탈로그 반영 |
| Supabase 테스트 데이터 | 지워도 되는지 확인 | 아래 SQL |

파일럿 전에 테스트 상을 비울 때 (**되돌릴 수 없습니다**):

```sql
delete from public.signups; delete from public.tables; delete from public.profiles;
```

---

## 6. 구조에서 알아둘 것

**계층:** `Policy → Projection → Capability → Entity → Value Object`
(`src/domain/`). 판단은 policy로 올리세요. 컴포넌트 안에 규칙을 쓰면 테스트가
닿지 않습니다 — "결과가 하나도 없을 때만 상 열기를 권한다"는 판단이 컴포넌트에
있다가 틀려서 `src/domain/policy/matching.js`로 옮긴 전례가 있습니다.

**저장소 이음매:** `src/data/tableRepository.js` 하나가 localStorage ⇄ Supabase를
가립니다. 백엔드를 바꿀 일이 있으면 이 파일만 봅니다.

**localStorage 키:** `bapchingu-tables`, `bapchingu-signups`, `bapchingu-profile`,
`kfm-bookmarks`, `kfm-markets`, `kfm-experiences`, `kfm-prologue`
(`kfm-` 접두사는 K-Food Map 시절 이름이 남은 것입니다).

**테스트:** Node 24 내장 러너, 의존성 0. `src/**/*.test.mjs`, 17개 파일 200개.

### 함정 두 개 — 둘 다 실제로 당했습니다

**대비를 측정할 땐 트랜지션을 끄세요.** `document.visibilityState === "hidden"`
이면 애니메이션 타임라인이 멈춰서 `getComputedStyle`이 **시작값**을 돌려줍니다.
없는 버그를 한참 쫓았습니다.

**두 탭은 두 사람이 아닙니다.** 같은 오리진의 탭은 Supabase 세션을 공유합니다.
멀티유저 테스트는 실제 로그아웃 사이클로 하세요.

---

## 7. 배포

```bash
git push        # master → test/main → Vercel
```

`origin`은 제거했고 `master`는 `test/main`을 추적합니다. Vercel 환경변수에
`VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`가 들어 있어야 프로덕션이 공유
저장소를 씁니다.

전체 배치는 `docs/where-this-deploys.md`. **옆 폴더의 K-Food Map은 다른 앱이고
다른 URL이며, 두 앱은 초기 git 이력을 공유합니다.** 그게 사고가 가능했던
이유입니다.
