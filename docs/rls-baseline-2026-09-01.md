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
