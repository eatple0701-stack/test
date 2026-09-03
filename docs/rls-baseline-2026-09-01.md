# RLS 기준선 — 2026-09-01 적용 시점

**이 숫자들은 시간에 따라 변합니다.** `is_open_host()`에 30일 창이 있어서
밥상이 창을 벗어나면 `stranger_sees_profiles`가 줄어듭니다. 기준 시점 없이
나중에 다시 재면 **정상 감소인지 회귀인지 구분할 수 없습니다.** 그래서
날짜와 데이터 상태를 같이 적어 둡니다.

재검증 방법: `supabase/migrations/2026-09-01b-scope-profile-reads-retry.sql`을
마지막 줄 `rollback;` 그대로 SQL 편집기에 붙여넣고 실행. 아무것도 안 바뀝니다.

---

## 적용 시점의 데이터 상태

**2026-09-01, 한국 시각 오후.** 이게 없으면 아래 숫자는 해석이 안 됩니다.

```
profiles   237행
tables       3건
signups      1건
```

밥상 3건:

| 요리 | 날짜 | 생성 | 30일 창 안? |
|---|---|---|---|
| 삼겹살 | 2026-08-06 | 08-04 | 예 (26일 전) — **09-05에 벗어남** |
| 감자탕 | 2026-08-22 | 08-19 | 예 (10일 전) — **09-21에 벗어남** |
| 간장게장 | 2026-09-03 | 09-01 06:23 | 예 (미래) |

신청 1건: 간장게장 밥상, `accepted`, 09-01 06:24.

## 적용 직후 숫자

```
profiles_total           237
stranger_sees_profiles     3     ← 밥상 3건의 호스트
member_sees_profiles       4     ← 위 3 + 본인 행
member_sees_own_row        1
host_sees_profiles         3
host_sees_own_row          1
signups_total              1
stranger_sees_signups      0
seat_holds_visible         1
tables_total               3
```

## 라이브에서 직접 확인한 것

익명 세션(`is_anonymous: true`)으로 `eatple.vercel.app`에서:

```
GET  /rest/v1/profiles?select=id   200  0-3/4      (적용 전: 0-236/237)
GET  /rest/v1/signups?select=id    200  */0
POST /rest/v1/rpc/seat_holds       200  [{"table_id":"0e3aa8f9…","status":"accepted"}]
POST /rest/v1/rpc/tables_with_woman 200 []
```

`seat_holds()`가 실제로 돌려준 것은 **밥상 id와 상태 두 개뿐**입니다 —
사용자 id도, 이름도, 국적도, note도, 성별도 없습니다.

그리고 목록 카드가 **"2 going · 2자리 남음"**을 렌더했습니다. 4석에 호스트 +
승인된 손님 1명. **그 손님의 행은 이 세션이 하나도 못 읽는데도** 좌석 수는
맞게 나옵니다 — 전부 `seat_holds()` → `mergeSeatHolds()` 경로입니다.

호스트 이름도 계속 렌더됩니다(`hostRecord()` 정상).

---

## 앞으로 예상되는 변화 — 회귀가 아님

| 시점 | `stranger_sees_profiles` | 이유 |
|---|---|---|
| 2026-09-01 | 3 | 밥상 3건 전부 창 안 |
| **2026-09-05~** | **2** | 삼겹살(08-06)이 30일 창을 벗어남 |
| **2026-09-21~** | **1** | 감자탕(08-22)도 벗어남 |
| 이후 | 다가오는 밥상 수만큼 | |

**늘어나면** 새 밥상이 생겼거나 정책이 느슨해진 것입니다.
**갑자기 237로 뛰면** 정책이 되돌려진 것입니다.

`member_sees_profiles`는 항상 `stranger_sees_profiles + 1`이어야 합니다
(본인 행). 아니면 `id = auth.uid()` 절이 사라진 것입니다.

`stranger_sees_signups`는 **언제나 0**이어야 합니다. 데이터가 늘어도
변하지 않습니다.

`seat_holds_visible`은 `signups_total`에서 거절된 요청과 취소된 밥상의
좌석을 뺀 수입니다. **둘 다 0이면 이 검사는 공허합니다** — 아무것도 안
돌려주는 함수도 통과합니다. 오늘은 `1 == 1`이라 실제 검사였습니다.

---

## 검증 이력

- **1차 시도** (`2026-09-01-scope-profile-reads.sql`) — 적용 후 42P17 재귀로
  즉시 롤백. 파일에 부검 있음, 실행 금지.
- **2차 시도** (`2026-09-01b-…-retry.sql`) — `security definer` 헬퍼로 재귀를
  구조적으로 차단. 적용 전 PGlite(wasm Postgres 18)로 실행 검증,
  트랜잭션 내 `rollback` 판으로 프로덕션 숫자 확인 후 `commit`.
- `src/domain/__tests__/rlsPolicies.test.mjs`가 마이그레이션 파일을 그대로
  실행합니다. **첫 테스트는 1차 시도를 적용해서 42P17이 재현되는지 확인**합니다
  — 하네스가 그 실패를 못 잡으면 나머지는 전부 장식이니까요.
- 일부러 깨뜨리기 25종, 전부 RED.

## 아직 열려 있는 것

`tables`는 여전히 `using (true)`이고, 거기에 `host_nationality`·`chat_url`·
`meeting_note`가 실려 있습니다. 트랙 2 — `docs/public-table-columns.md`.

---

# 2026-09-01c — 좌석 만료 (적용 완료)

`supabase/migrations/2026-09-01c-seat-holds-lapse.sql`

## 적용 후 확인된 값

```
helpers               2      (lapse_window, lapse_at 생성됨)
seat_holds_has_clock  1
guard_has_clock       1
guard_trigger         1      (트리거는 건드리지 않았고 그대로 살아 있음)
anon_can_read_seats   true   (익명 세션의 좌석 수가 안 끊김)
lapse_seconds         43200
```

## 무엇이 바뀌었나

- **새로 생김**: `lapse_window()`(12시간), `lapse_at(날짜, 시각)`(답변 마감 시각)
- **교체됨**: `seat_holds()`, `assert_seat_available()` — 둘 다 이제
  "승인된 자리 + 답변 기한이 남은 대기"만 좌석으로 셈

**진짜로 고쳐진 것은 `assert_seat_available()`입니다.** 그전에는 상태를 보지
않고 `count(*)`를 세서 **거절된 요청이 영구히 좌석을 차지**했습니다 — 호스트가
4석 밥상에서 3명을 거절하면 그 밥상은 다시는 아무도 못 들어갔습니다.
화면은 "2자리 남음"인데 신청은 `table_full`로 거부되는 상태였습니다.

카드의 좌석 수는 그전에도 맞았습니다 — 클라이언트가 `stillHolding()`으로
만료 규칙을 다시 적용하기 때문입니다.

## 되돌리기

`supabase/migrations/2026-09-01c-seat-holds-lapse-ROLLBACK.sql`.
적용 **전에** 작성했고 PGlite에서 실제로 돌려 확인했습니다
(`seatLapse.test.mjs` 마지막 두 테스트). 되돌리면 위 두 버그가 같이
돌아옵니다 — 안전하지만 공짜는 아닙니다.

## 남은 주의사항 두 가지

### 1. `lapse_at()`의 `immutable` 선언 — 확인했고, 바꿀 필요 없습니다

검토에서 "`at time zone 'Asia/Seoul'`은 stable이니 `immutable` 선언이
거짓"이라는 지적이 있었습니다. **일반론은 맞고 이 경우엔 아닙니다.**

`timezone`은 **오버로드가 7개**이고 그중 2개만 stable입니다. 서명 없이
`select provolatile from pg_proc where proname='timezone'`을 돌리면 7개 중
아무거나 하나가 나옵니다 — 그래서 `s`가 잡힌 것입니다. 우리 표현식이 고르는
것은 이쪽입니다:

```
timezone(text, timestamp without time zone) → IMMUTABLE
```

PostgreSQL 자신이 그렇게 표시해 둔 것이라, `lapse_at()`의 `immutable`은
본문과 일치합니다.

**다만 지적의 핵심은 유효합니다** — Postgres는 volatility 선언을 검증하지
않습니다(확인: `select now()` 본문을 `immutable`로 선언해도 함수가 그냥
만들어집니다). 그리고 tzdata가 갱신되면 시간대 변환 결과가 달라질 수
있는데도 PostgreSQL이 immutable로 표시해 둔 것은 알려진 타협입니다.

**그래서 실질적인 규칙은 이것입니다: `lapse_at()`으로 인덱스를 만들지
마세요.** tzdata가 갱신되면 인덱스가 조용히 낡습니다. 지금은 아무 데서도
인덱스로 쓰지 않습니다.

### 2. `lapse_window()` / `lapse_at()`에 anon 실행 권한이 없습니다

`authenticated`에만 grant돼 있습니다. 지금은 `security definer` 함수
(`seat_holds`, `assert_seat_available`) 안에서만 불리고, definer 함수 안에서는
호출자 권한이 아니라 소유자 권한으로 돌기 때문에 문제가 없습니다.

**클라이언트가 이 둘을 RPC로 직접 부르면 깨집니다.** 부를 일이 생기면
`grant execute ... to anon`을 먼저 추가하세요. `seat_holds()`는 별개로
anon 실행 권한이 있습니다(`anon=X/postgres`) — 익명 방문자의 좌석 수가
그것에 달려 있습니다.

---

## 3. `schema.sql`이 새 프로젝트에서 실행되지 않고 있었습니다 — 재해 복구 관점

**추가 2026-09-01 밤.** 2026-09-01e를 적용한 뒤 감사하다 나왔습니다.

### 무엇이 깨져 있었나

`supabase/schema.sql` 3행은 이 파일에 대해 이렇게 적고 있습니다:
"Run this once in the Supabase SQL editor after creating the project."
그게 이 파일의 존재 이유 전부입니다. 그런데 **빈 프로젝트에서 실행하면
중간에 죽습니다.**

```
ERROR: 42703: column t.cancelled_at does not exist
```

`is_open_host()`가 `tables.cancelled_at`을 읽는데, 그 컬럼을 만드는

```sql
alter table public.tables add column if not exists cancelled_at timestamptz;
```

이 **80줄 아래**에 있었습니다. `is_open_host()`는 `language sql`이고,
PostgreSQL은 그런 함수의 본문을 **생성 시점에 파싱·분석**합니다
(`check_function_bodies`가 기본 on). 없는 컬럼을 읽는 본문은 그 자리에서
42703을 냅니다.

**SQL 편집기는 붙여넣은 전체를 한 트랜잭션으로 돌립니다.** 그래서 결과는
"일부만 만들어짐"이 아니라 **전부 롤백**입니다. 새 프로젝트는 정책이
잘못된 상태가 아니라 **아무것도 없는 상태**로 올라옵니다.

### 이것이 실제로 뜻하는 것

프로덕션 DB에는 실제 파일럿 참가자 데이터가 들어 있습니다. 그것을 잃었을 때
**다시 세울 방법이 없었습니다.** 백업이 있다고 믿고 있었는데 백업이 열리지
않는 상태였던 셈입니다.

### 왜 프로덕션은 멀쩡했나

프로덕션은 이 파일로 한 번에 세운 적이 **한 번도 없습니다.** 기능이 생길
때마다 조각을 붙여넣었고, 각 함수를 쓸 때는 그 함수가 읽는 컬럼이 이미
있었습니다. **순서가 우연히 맞았던 것**이지, 파일이 옳았던 게 아닙니다.
그래서 프로덕션이 잘 도는 것은 이 파일이 옳다는 증거가 전혀 아니었습니다.

### 테스트 두 개가 그 드리프트를 정답으로 고정하고 있었습니다

이게 이 사고에서 가장 불편한 부분입니다.

1. **`profileExposure.test.mjs`의 헬퍼 비교가 `2026-09-01b` 한 파일만
   읽고 있었습니다.** 작성 당시에는 맞았지만 그 뒤 01c가 `seat_holds`에
   시계를 넣고 01e가 취소를 가르쳤습니다. 한 파일에 고정된 테스트는
   **프로덕션이 두 번 갈아치운 정의를 schema.sql이 유지하라고 요구**하고
   있었습니다 — 드리프트를 잡는 게 일인 파일 안에서, 드리프트를 정답으로
   박아둔 것입니다.

   그리고 그 비교 대상 목록(`HELPERS`)이 손으로 쓴 것이라
   `seat_holds`는 들어 있고 `assert_seat_available`은 빠져 있었습니다.
   그래서 schema.sql은 **01c 이전의 좌석 가드**를 그대로 들고
   있었습니다 — 상태를 보지 않고 전 행을 세는 버전, 즉 거절 3번이면
   4인 밥상이 영구히 닫히는 그 버그입니다.

2. **같은 파일의 다른 검사가 소스 문자열을 보고 있었습니다.**
   `/'pending', 'accepted'/`가 있으면 "거절은 제외된다"고 판정했는데,
   01c가 같은 규칙을 시계가 든 2분기 조건으로 다시 쓰면서 그 문자열이
   사라졌습니다. 올바른 변경을 실패시키고, 문자열만 남은 잘못된 변경은
   통과시켰을 검사입니다. `CLAUDE.md`가 이미 금지하고 있는 형태인데
   남아 있었습니다.

셋째로, **schema.sql을 실행해 본 테스트가 하나도 없었습니다.**
`rlsPolicies`/`seatLapse`는 진짜 Postgres를 쓰지만 **마이그레이션**을
돌립니다. `profileExposure`는 schema.sql을 **텍스트로만** 읽어서 문장
순서를 구조적으로 볼 수 없습니다. `schemaDrift`는 컬럼 **이름**만 봅니다.

### 앞으로 막는 것

- **`src/domain/__tests__/schemaSqlRuns.test.mjs`** — 빈 DB(플랫폼이 주는
  것만 있는 상태)에 schema.sql을 **한 트랜잭션으로 실제 실행**합니다.
  앱이 없으면 안 되는 함수·정책을 이름으로 확인하고, RLS만 켜지고 정책이
  없는 테이블이 없는지 보고(`notifications`/`pilot_team`은 의도적으로
  전원 거부라 이름을 적어 예외 처리하고, 그 둘이 정말 잠겨 있는지는
  따로 단언합니다), 두 번 돌려도 같은지 확인합니다. 마지막 테스트는
  문제의 ALTER를 원래 자리로 되돌려 **스크립트가 실패하는 것**을
  요구합니다.
- **파생된 드리프트 검사** — 손으로 쓴 목록을 없앴습니다. 적용된
  마이그레이션이 정의한 **모든** 함수·정책·컬럼이 schema.sql에 같은
  본문으로 있어야 합니다.
- **`scripts/schema-catalog.mjs`** — 아래 대조에 씁니다.

### 지금 이 파일로 빈 프로젝트를 세우면 프로덕션과 같은가

**아직 모릅니다. 대조하는 방법을 만들어 뒀고, 프로덕션 쪽 한 번의 실행이
남았습니다.** "아마 같다"고 적지 않겠습니다.

schema.sql 쪽 숫자는 실측했습니다:

```
node scripts/schema-catalog.mjs
```

| | 개수 |
|---|---|
| 컬럼 | 80 |
| 함수 | 15 |
| 정책 | 21 |
| 트리거 | 7 |
| 인덱스 | 16 |
| RLS 상태(테이블) | 9 |
| **합계 항목** | **148** |

프로덕션 쪽은 여기서 읽을 수 없습니다. SQL 편집기에서 아래를 돌리고
결과를 TSV로 내려받아 주세요 (Export → CSV도 됩니다):

```sql
-- 프로덕션 카탈로그. 읽기 전용, 아무것도 바꾸지 않습니다.
-- scripts/schema-catalog.mjs 가 내는 것과 정확히 같은 모양·같은 순서입니다.
select 'column'   as kind, table_name || '.' || column_name || ':' || data_type as v
  from information_schema.columns where table_schema = 'public'
union all
select 'function', p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')'
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'
union all
select 'policy', tablename || '.' || policyname || ':' || cmd
  from pg_policies where schemaname = 'public'
union all
select 'trigger', c.relname || '.' || t.tgname
  from pg_trigger t join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and not t.tgisinternal
union all
select 'index', tablename || '.' || indexname
  from pg_indexes where schemaname = 'public'
union all
select 'rls', c.relname || ':' || c.relrowsecurity
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r'
order by 1, 2;
```

그다음:

```sh
node scripts/schema-catalog.mjs --diff live.tsv
```

차이가 0이면 종료 코드 0으로 끝나고, 아니면 **어느 쪽에만 있는지 한 줄씩**
찍습니다. 차이가 나올 것으로 예상되는 항목이 최소 하나 있습니다:
프로덕션에는 2026-09-01에 롤백한 시도의 흔적이나 대시보드에서 손으로 만든
것이 남아 있을 수 있고, 반대로 schema.sql에는 `2026-09-01d`(메일 언어)가
아직 없습니다 — **d는 적용하지 않았으므로 양쪽 다 없어야 정상입니다.**
---

# 2026-09-02a — 동의 이력 (적용 완료)

`supabase/migrations/2026-09-02a-rules-consents-history.sql`

## 적용 후 확인된 값

트랜잭션 안에서 한 번(`rollback;`), 커밋 뒤 **트랜잭션 밖에서 다시** 읽었습니다.
두 번 다 같은 값입니다.

```
consents_table                1
profile_id_nullable           YES
rls_enabled                   true
policies_on_table             0
anon_can_select               false
authenticated_can_select      false
trigger_on_insert_and_update  true
function_path_pinned          true
backfilled_rows               10
profiles_with_version         10
profiles_total                253   (참고값)
```

`backfilled_rows`와 `profiles_with_version`이 같다는 것이 합격 조건입니다.
앞의 것이 더 크면 **동의하지 않은 행까지 이력에 적히고 있다**는 뜻입니다.

트랜잭션 밖 확인 사이에 앱을 한 번 열었고(`profiles_total` 253), 그 세션은
동의를 누르지 않았습니다 — 이력은 10 그대로였습니다. 앱이 정상 동작한 것
자체가 트리거의 첫 프로덕션 실행이고, 프로필 저장이 성공했으니 트리거가
예외를 던지지 않는다는 것이 실물로 확인된 셈입니다.

## 무엇이 바뀌었나

- **새로 생김**: `rules_consents` 테이블, `keep_rules_consent()` 트리거 함수,
  `profiles_keep_rules_consent` 트리거(INSERT + UPDATE)
- **바뀌지 않음**: 클라이언트. `profiles`의 두 열을 쓰는 코드 그대로입니다

불변식 한 줄: **`rules_consents`가 완전한 기록이고,
`profiles.rules_version`/`rules_agreed_at`은 최신 것의 캐시입니다.**

`PURPOSE.version`을 1→2로 올리면 v1에 동의한 10개 프로필이 다시 묻는 화면을
보고, 그 순간 두 열이 덮어써집니다. 이 마이그레이션이 먼저 적용된 덕분에
v1 기록이 이력에 남습니다. **순서를 뒤집으면 v1은 사라집니다.**

## 주의사항

- **트리거는 절대 예외를 던지면 안 됩니다.** 앱을 열 때마다 upsert되는 행에
  달린 트리거라, 실패하면 프로필 저장 자체가 실패합니다. `on conflict do
  nothing`이 그것을 보장합니다 — 오래된 기기가 이력에 이미 있는 동의를 다시
  보내도 흡수됩니다. INSERT 분기가 필요한 이유도 같습니다: 클라이언트가
  upsert하므로 첫 동의는 UPDATE가 아니라 INSERT로 도착합니다.
- **RLS on, 정책 0개, anon·authenticated select 권한 없음.** 클라이언트는 이
  테이블을 읽지 않습니다. 확인은 행 수가 아니라 권한으로 합니다 — 권한이 없는
  롤은 세지도 못하고 "permission denied"를 받습니다.
- **`on delete set null`.** 사람을 지우면 링크가 끊기고 사실은 남습니다.
  대시보드의 사용자 삭제는 auth.users → profiles로 캐스케이드하는데, 여기서
  그것이 파괴가 아니라 익명화가 됩니다.
- 되돌리기: `2026-09-02a-rules-consents-history-ROLLBACK.sql`. **이력을
  버립니다** — 누군가 새 버전에 재동의한 뒤에는 돌리지 마세요.

## 검증

`rulesConsents.test.mjs` 18개가 PGlite에서 마이그레이션을 실제로 실행합니다.
첫 테스트는 마이그레이션 **없이** 재동의를 수행해 남는 증거가 0임을 보이는
대조군입니다. `schemaSqlRuns.test.mjs`는 `schema.sql`에 접힌 사본을
클라이언트와 같은 방식(upsert)으로 몰아 행을 셉니다 — 트리거만 빼면 텍스트
대조는 전부 초록이고 그 테스트만 빨갛습니다.

