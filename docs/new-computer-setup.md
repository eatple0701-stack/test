# 새 컴퓨터에서 작업 시작하기

팀 계정으로 어느 컴퓨터에서든 이어서 작업하는 방법. 처음 한 번만 10분,
그 뒤로는 `git pull` → 작업 → `git push`가 전부입니다.

검증됨: **2026-09-01 다시 확인.** 팀 저장소를 빈 폴더에 새로 클론해
`.env.local` 없이 `npm install` → 테스트 886개 전부 통과 · i18n 감사 0건 ·
빌드 성공. 클론은 `main` 브랜치로 나옵니다.
(8-22에는 579개였습니다 — 숫자는 늘어납니다. 중요한 건 `fail 0`입니다.)

---

## 0. 미리 깔 것 (한 번만)

| | 확인 명령 | 없으면 |
|---|---|---|
| **Node.js** 22.18 이상 | `node -v` | https://nodejs.org (LTS) |
| **Git** | `git --version` | https://git-scm.com |
| **Claude Code** | `claude --version` | https://claude.com/claude-code |

Windows에서 Node를 처음 깐다면 설치 후 터미널을 새로 열어야 인식됩니다.

> **20이 아니라 22.18입니다.** 2026-09-01에 세 버전에서 직접 돌려 확인했습니다.
> - **24.18.0** — 789개 전부 통과 (그날의 개수. 지금은 886개이고, 24.18에서 통과 확인)
> - **22.18.0** — 789개 전부 통과 (24와 정확히 같은 수 — 버전 간 차이가 없다는 것이 요점입니다)
> - **20.18.0** — `npm test` 자체가 안 됩니다. 두 가지가 걸립니다:
>   `--test` 가 글롭(`src/**/*.test.mjs`)을 못 받고,
>   메일 테스트가 엣지 함수 `.ts` 를 직접 import 하는데 20에는 타입 스트리핑이
>   없어 `ERR_UNKNOWN_FILE_EXTENSION` 이 납니다.
>
> `package.json` 의 `engines` 도 `>=22.18.0` 이고, 이 값은 **실제로 통과를
> 확인한 최저 버전**입니다. 짐작이 아닙니다.

## 1. 저장소 받기

```sh
git clone https://github.com/eatple0701-stack/test.git eatple
cd eatple
npm install
git config core.hooksPath .githooks
```

- 공개 저장소라 **받는 데는 로그인이 필요 없습니다**
  (받는 데 17MB, `npm install` 뒤 폴더는 400MB 안팎)
- 마지막 줄은 잘못된 저장소로 푸시하는 사고를 막는 후크를 켜는 것입니다.
  이건 클론마다 한 번씩 해줘야 합니다 (git 설정이라 저장소를 따라오지 않음)

## 2. 잘 됐는지 확인

```sh
npm test                      # 886개 전부 통과해야 정상
node scripts/audit-i18n.mjs   # 0 이 나와야 정상
npm run dev                   # http://localhost:5177
```

**비밀키·환경변수 없이 여기까지 전부 됩니다.** 서울 식당 데이터 8,118곳이
저장소에 들어 있어서요.

> 로컬에서 실행하면 밥상 데이터는 그 브라우저에만 저장됩니다(localStorage).
> 실제 공유 데이터를 보려면 배포본 https://eatple.vercel.app 을 쓰세요.
> 로컬에서도 공유 DB에 붙이고 싶으면 `.env.example`을 `.env.local`로 복사하고
> `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 두 값을 넣으면 됩니다
> (둘 다 공개용 값이라 `api/table-og.js` 22~24행에 이미 들어 있습니다).

> ### ⚠ `.env.local`을 넣으면 dev 서버가 **운영 DB에 씁니다**
>
> 읽기만 하는 게 아닙니다. 앱을 여는 순간 익명 로그인이 일어나고 운영
> `profiles`에 행이 하나 생깁니다. 브라우저마다 하나씩, 저장소를 비우면
> 또 하나.
>
> 그 행은 **둘러보고 나간 진짜 방문자와 모든 칸이 똑같아서** 나중에
> 골라낼 수 없습니다. 이름·국적·언어·동의 기록 전부 비어 있는 것이
> 양쪽 다 같습니다. 그리고 그 숫자가 KF 결과보고서에 들어갑니다.
>
> **그래서 dev를 붙일 때마다 계정 id를 적어두세요.**
> `docs/pilot-participant-count.md` §7의 표에 한 줄 추가하면 됩니다.
> id는 브라우저 콘솔에서:
>
> ```
> JSON.parse(Object.entries(localStorage).find(([k]) => k.includes('auth-token'))[1]).user.id
> ```
>
> 안 적으면 그 행은 영구히 참가자 수에 섞입니다. 지금까지 섞인 것이
> 몇 개인지는 아무도 모릅니다 — 그래서 이 경고가 있습니다.
>
> dev 전용 프로젝트를 따로 만드는 게 근본 해결이고, 아직 안 했습니다
> (규모는 `docs/pilot-participant-count.md` §7 마지막에).

## 3. 클로드에게 인수인계 받기

그 폴더에서 `claude` 를 실행하고, 첫 메시지로 이걸 그대로 붙여넣으세요:

```
docs/HANDOVER.md 를 읽고 이 프로젝트를 인수인계 받아.
읽고 나서 현재 상태 요약이랑 지금 해야 할 일을 나한테 보고해줘.
```

`CLAUDE.md`(작업 규칙)는 그 폴더에서 클로드를 켜면 **자동으로 읽힙니다.**
따로 시킬 필요 없습니다.

## 4. 작업한 것 올리기 (푸시할 때만 로그인 필요)

```sh
git pull        # 시작 전 — 남이 한 작업 받아오기
# ...작업...
git push        # 끝나면 — 올리기 + Vercel 자동 배포
```

처음 `git push` 할 때 GitHub 로그인을 물어봅니다. **팀 계정
(eatple0701-stack)** 으로 인증하세요. 가장 쉬운 방법:

```sh
gh auth login     # GitHub CLI. 브라우저로 인증 — 비밀번호 입력 없음
```

GitHub CLI가 없으면 https://cli.github.com 에서 설치하거나, 그냥 `git push`
했을 때 뜨는 브라우저 창에서 로그인해도 됩니다.

> **비밀번호를 클로드에게 알려주지 마세요.** 로그인은 브라우저에서 사람이
> 직접 하는 일이고, 클로드는 그 과정을 안내만 합니다.

## 5. 여러 사람이 같이 쓸 때

동기화는 GitHub을 거칩니다. **실시간이 아니라** `push`/`pull` 시점에 반영돼요.

```
컴퓨터 A ──push──> GitHub <──pull── 컴퓨터 B
                     │
                     └──> Vercel 자동 배포
```

- 작업 **시작 전에 `git pull`**, 끝나면 **바로 `git push`** — 이것만 지키면
  충돌이 거의 없습니다
- 같은 파일을 동시에 고치면 충돌이 납니다. 서로 다른 화면/기능을 맡으세요
- 충돌이 났을 때 클로드에게 "git 충돌 났어, 해결해줘" 하면 도와줍니다

## 자주 막히는 곳

**`git push` 가 "push refused" 로 거부됨**
`.githooks/pre-push`가 밥친구가 아닌 저장소로 가는 푸시를 막습니다. 주소가
`eatple0701-stack/test`가 맞는지 `git remote -v`로 확인하세요. 맞는데도
막히면 후크의 `ALLOWED` 목록을 보세요 — 2026-08-02에 다른 앱의 라이브
사이트를 덮어쓴 사고 때문에 있는 장치입니다 (`docs/where-this-deploys.md`).

**`npm test` 개수가 위와 다름**
`git pull` 로 최신을 받았는지 확인하세요. 테스트가 늘어난 경우라면
README.md / HANDOFF.md 의 숫자도 같이 고쳐야 합니다 (그걸 검사하는 테스트가
있습니다).

**서울 식당 데이터를 다시 받고 싶을 때**
`.env.local`에 `SEOUL_FOOD_API_KEY`가 필요합니다. 이것만은 **진짜 비밀키**라
공유하지 마시고, data.go.kr에서 데이터셋 15097605 활용신청으로 각자
발급받으세요(무료, 1~2분). 앱 개발·배포에는 필요 없습니다.
