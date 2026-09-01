# 개인 계정 → 팀 계정 이관 — 완료 기록

**2026-08-22에 끝났습니다.** 아래는 완료된 상태이고, 절차는 같은 일을 다시
할 사람(또는 다른 프로젝트)을 위해 그대로 남겨 둡니다.

| | 상태 |
|---|---|
| GitHub | ✅ `eatple0701-stack/test` |
| Vercel | ✅ 팀 계정 · **https://eatple.vercel.app** |
| Supabase | ✅ `Eatple` 조직 — 프로젝트 이전(Transfer), 주소·키·데이터 그대로 |
| 알림 메일 링크 | ✅ DB 함수 4개 갱신 (`notify_seat_requested`, `notify_seat_decided`, `notify_table_cancelled`, `notify_report_filed`) |
| Site URL / Redirect URLs | ✅ `eatple.vercel.app` + `/**` + `localhost:*` |
| Google Cloud (OAuth) | ✅ 팀 계정 — 이번 이관에서 **손댈 필요 없었음** (리디렉션이 Supabase 주소를 가리켜서) |
| data.go.kr API 키 | 강민 개인 명의 — 데이터 재빌드할 때만 필요, 팀원은 각자 발급 |

**이관에서 배운 것 하나**: Supabase 프로젝트를 *이전*하면 주소·키·데이터가
그대로라 앱은 한 줄도 안 바뀝니다. *새로 만들면* 구글 OAuth 재등록, 지메일
앱 비밀번호 재발급, 스키마 재실행이 전부 따라옵니다. 이전이 압도적으로 쌉니다.

---

## ⚠️ 시작 전에 — 가장 중요한 함정

`src/data/supabaseBackend.js`에는 환경변수 **폴백이 없습니다.**

```js
const URL = import.meta.env?.VITE_SUPABASE_URL;   // 없으면 undefined
const KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY;
export const isConfigured = () => Boolean(URL && KEY);
```

새 Vercel 프로젝트에 이 두 값을 **넣지 않으면 배포는 성공하고 화면도 멀쩡히
뜨지만**, 앱이 조용히 localStorage 모드로 떨어져 **밥상이 기기 간에 공유되지
않습니다.** 에러도 안 납니다. 파일럿을 죽이는 가장 쉬운 방법이니 3단계를
건너뛰지 마세요.

두 값은 비밀이 아닙니다 — anon 키는 공개용으로 설계됐고 브라우저 번들에 이미
들어갑니다. 실제로 `api/table-og.js` 22~24행에 폴백으로 커밋돼 있어서, 거기서
그대로 복사하면 됩니다. (`sb_secret_…`로 시작하는 키는 절대 여기 넣지 마세요.)

---

## Vercel 이관 (30분)

Vercel의 "Team"은 유료라, 무료로 가려면 **팀 계정(eatple0701)의 개인
Vercel 계정**으로 새로 import 하는 방식입니다. 기존 프로젝트를 옮기는 게
아니라 새로 만드는 것이라, 배포 URL이 바뀝니다.

### 1. 팀 계정으로 Vercel 가입
- https://vercel.com → **Continue with GitHub**
- 팀 GitHub 계정(`eatple0701-stack`)으로 로그인 → Hobby(무료) 선택

### 2. 레포 import
- **Add New… → Project** → `eatple0701-stack/test` 선택 → Import
- Vercel이 접근 권한을 물으면 이 레포에만 허용
- **Project Name**을 바꾸세요 — 이게 URL이 됩니다.
  `test`로 두면 또 `test-xxxx.vercel.app`이 됩니다.
  확인해 본 결과 아래는 비어 있습니다:
  `eatple` / `eatple-app` / `bapchingu` / `eatple-kr` / `eatple-project`
  → **`eatple` 권장** (`https://eatple.vercel.app`)
- Framework Preset: **Vite** (자동 감지됨)
- Build Command / Output Directory: 손대지 마세요 (`vercel.json`이 이미
  rewrite 규칙과 OG 함수 경로를 담고 있습니다)

### 3. 환경변수 2개 — 건너뛰면 안 됨 ⚠️
Import 화면의 **Environment Variables**에서:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `api/table-og.js` 22행의 URL |
| `VITE_SUPABASE_ANON_KEY` | `api/table-og.js` 24행의 `sb_publishable_…` |

Production / Preview / Development 모두 체크. → **Deploy**

### 4. 배포 확인
새 URL에서 아래가 전부 나와야 정상입니다:
- 첫 화면에 6개 카테고리 카드
- 지도에 색깔 점들 (8,118곳)
- `<새URL>/data/seoul/index.json` 이 `"total":8118` 반환
- **밥상 탭에서 기존 밥상이 보이면** env 변수가 제대로 들어간 것
  (안 보이고 텅 비어 있으면 3단계 실패 → 다시 확인)

### 5. Supabase 쪽 주소 갱신
Supabase 대시보드 → **Authentication → URL Configuration**
- **Site URL**: 새 URL로 교체 → Save changes
- **Redirect URLs**: 새 주소를 **먼저 추가**하고 나서 옛 주소를 지우세요.
  순서를 바꾸면 그 사이에 로그인이 깨집니다. 하위 경로(`/tables/xxx`)로
  돌아오는 경우가 있어 와일드카드까지 넣습니다:
  `https://<새주소>/**`. `http://localhost:*`는 남겨 두세요 (로컬 개발용)

> 구글 OAuth는 **손댈 필요 없습니다.** 구글에 등록된 리디렉션 주소는 앱이
> 아니라 Supabase 주소(`…supabase.co/auth/v1/callback`)라서, 앱 URL이 바뀌어도
> 그대로 유효합니다.

### 6. 코드 안 옛 주소 교체
17곳이 있었습니다: `index.html` OG 태그 3곳(카톡 공유 미리보기),
`api/table-og.js` 3곳(밥상 링크 카드), `supabase/schema.sql` 5곳(알림 메일
본문), 문서 6곳. 파일 쪽은 커밋 한 번으로 끝납니다.

**DB 안의 5곳은 파일을 고쳐도 안 바뀝니다.** Postgres에 이미 컴파일돼 저장된
함수라서요. SQL Editor에 이것만 붙여넣고 Run 하면 됩니다 — 옛 주소가 든 함수를
찾아 정의를 꺼내 주소만 바꿔 다시 넣습니다. 트리거는 함수를 이름으로
참조하므로 **건드릴 필요가 없습니다**:

```sql
do $do$
declare r record; n int := 0;
begin
  for r in select oid, proname from pg_proc
            where prosrc like '%예전주소.vercel.app%'
  loop
    execute replace(pg_get_functiondef(r.oid),
                    '예전주소.vercel.app', '새주소.vercel.app');
    n := n + 1;
  end loop;
  raise notice '% function(s) updated', n;
end
$do$;
```

확인: `select proname from pg_proc where prosrc like '%새주소.vercel.app%';`
→ `notify_seat_requested` / `notify_seat_decided` /
`notify_table_cancelled` / `notify_report_filed` 4개가 나오면 성공.

(`supabase/migrations/2026-08-22-new-app-url.sql`에 함수 전문을 붙여넣는
방식도 있지만, 그쪽은 트리거까지 드롭·재생성해서 굳이 필요 없는 위험을
만듭니다. 위 방법을 쓰세요.)

### 7. 옛 Vercel 프로젝트 정리
새 배포가 확인되면, 강민님 Vercel의 옛 프로젝트를 **삭제하거나 GitHub 연결을
해제**하세요. 그냥 두면 같은 레포로 두 곳이 계속 배포돼서, 나중에 어느 주소가
진짜인지 헷갈립니다. (옛 주소로 공유해 둔 링크가 있으면 며칠 유예를 두고
지우세요.)

---

## Supabase 이관 (선택, 10분)

제일 쉽고 **앱 수정이 0건**입니다. 프로젝트 주소·키·데이터가 전부 그대로라
코드도 환경변수도 손댈 게 없습니다.

1. 팀 계정으로 Supabase 로그인 → **Organization** 하나 생성
2. 강민님 계정 → 해당 프로젝트 → **Settings → General → Transfer Project**
   → 팀 조직 선택
3. 이전 후 강민님을 그 조직 멤버로 초대받으면 계속 관리 가능

Edge Function의 Secrets(지메일 앱 비밀번호 등)는 프로젝트에 붙어 있어서 같이
넘어갑니다 — 재입력 불필요.

---

## 이관 후: 두 계정 모두에서 작업하기

**팀 계정 (새 컴퓨터/새 사람)**
```sh
git clone https://github.com/eatple0701-stack/test.git
cd test
npm install
git config core.hooksPath .githooks   # 잘못된 레포로 푸시 방지
npm test                              # 747개 통과하면 정상
npm run dev                           # 5177 포트
```
비밀정보 없이 전부 돌아갑니다 — 데이터가 레포에 들어 있어서요. 검증 완료
(2026-08-22, 새 클론에서 전부 통과·감사 0건·빌드 성공).
푸시할 때만 팀 GitHub 계정 로그인이 필요합니다 (`gh auth login`).

**강민님 개인 계정 (지금 이 환경)**
그대로 계속 쓰시면 됩니다. 팀 레포 푸시 권한 확인 완료.
`.githooks/pre-push`가 신·구 주소를 모두 허용하도록 고쳐져 있습니다.

**데이터 파이프라인을 다시 돌릴 때만** `.env.local`에 `SEOUL_FOOD_API_KEY`가
필요합니다. 앱 실행·배포에는 필요 없습니다. 팀원은 data.go.kr에서 같은
데이터셋(15097605) 활용신청으로 자기 키를 받으면 됩니다. **이 키는 카톡·드라이브
등에 올리지 마세요.**
