# `tables`에서 무엇이 진짜 공개여야 하는가

**작성 2026-09-01.** `profiles` 정책을 다시 쓰기 전에 정해야 하는 것.
결정 사항이므로 코드보다 먼저 읽고 답을 주세요.

---

## 왜 이게 먼저인가

`profiles`를 아무리 잠가도 `tables`가 `using (true)`인 한 호스트의
이름·국적·성별은 그 공개 행으로 그대로 나갑니다. 잠근 문 옆에 열린 창문이
있는 셈이라, 순서가 반대면 의미가 없습니다.

## 지금 공개된 것 (전부)

```
id  menu_id  host_id  host_name  host_nationality  host_gender
host_verified  host_kind  date  time  place  restaurant  seats
note  meeting_note  chat_url  lat  lng  guides  languages
is_sample  cancelled_at  created_at
```

`chat_url`의 스키마 주석은 이 노출을 **이미 알고 있었고 허용한다고
적어** 두었습니다:

> "an API reader can see it, which is acceptable for a link the host chose
> to share with strangers they invited."

그 판단을 뒤집자는 제안입니다. 이유는 집합이 다르기 때문입니다 — 호스트가
링크를 공유하기로 한 대상은 **자기가 초대한 사람들**이고, 실제로 읽을 수
있는 대상은 **anon 키를 가진 누구나**입니다. anon 키는 모든 번들에
들어갑니다. 신고·차단을 만들어 두고 채팅방은 아무나 들어갈 수 있는 상태를
안전 섹션이 약속한 것과 나란히 두기 어렵습니다.

**지금은 아직 이론입니다** — 현재 밥상 2건 모두 `chat_url`이 비어
있습니다. 호스트가 하나 넣는 순간 실제가 됩니다.

---

## 제안

### 공개 — 밥상의 진열창

```
id  menu_id  host_id  host_name  host_verified  host_kind
date  time  place  restaurant  seats  note  guides  languages
lat  lng  is_sample  cancelled_at  created_at
```

호스트가 밥상을 열면서 **스스로 내건 것들**입니다. 이게 없으면 밥상을
고를 수가 없습니다.

`lat`/`lng`은 공개로 둡니다. `place`("홍대입구 3번 출구")가 이미 공개라
좌표가 새 정보를 더하지 않고 정밀도만 올립니다.

### 밥상에 앉은 사람만 — 호스트 + 신청자

```
chat_url        모임 채팅방 주소
meeting_note    "빨간 가방 들고 있을게요" — 특정인을 알아보는 법
host_nationality
```

앞의 둘은 **좌표·시각과 합쳐지면 특정 개인에게 접근하는 방법**이 됩니다.
UI는 이미 이 둘을 게이트하고 있고, 데이터만 안 하고 있습니다.

`host_nationality`는 **공개 화면 어디에도 렌더되지 않습니다.** 목록에도
상세에도 없고, 여권(본인 기록)에만 나옵니다. 공개할 이유가 없습니다.

---

## 스케치와 다르게 제안하는 두 가지

### 1. `host_name`은 목록에서도 보여야 합니다

"목록에선 가리고 상세에서만"은 이 앱이 **안전 섹션에서 한 약속과
정면으로 충돌합니다**:

> **You see who is hosting before you ask**
> 청하기 전에 호스트가 누구인지 봅니다

`src/content/safetyPromise.js`의 첫 항목이고, 그 파일은 "여기 적힌 것은
앱이 실제로 하는 것만"이라는 규칙 아래 있습니다. 목록에서 이름을 빼면 그
약속이 거짓이 됩니다.

그리고 이름은 **표시명**입니다 — 본명일 필요가 없고, `개인정보-수집-실태.md`가
이미 "다른 참가자에게 보이는 것"으로 명시한 항목입니다. 공개가 맞습니다.

### 2. `host_gender`는 가리면 안전 기능이 깨집니다 — 대신 파생값으로

여성 전용 필터(`tableIncludesGender`)는 **클라이언트에서** 돌고, 목록의
모든 밥상에 `hostGender`가 있어야 동작합니다. 목록에서 빼면 필터가
죽습니다. 안전을 위해 가리는 것이 안전 기능을 끄는 결과가 됩니다.

**대신 성별 자체를 공개하지 말고, 필터가 실제로 묻는 것만 공개합시다.**
필터의 질문은 "이 밥상에 여성이 있는가"이지 "호스트의 성별이 무엇인가"가
아닙니다. 공개 뷰에 파생 불리언 하나를 둡니다:

```
has_woman  boolean   -- 호스트 또는 신청자 중 여성으로 밝힌 사람이 있는가
```

필터는 그대로 동작하고, **누구의 성별도 공개되지 않습니다.** 상세에서
호스트 성별을 보여주던 자리는 밥상에 앉은 사람만 보게 됩니다.

이건 스케치보다 더 잠그는 방향입니다 — 상세에서도 안 보이니까요.

---

## 기계장치

공개 뷰 `tables_public`을 만들고, 원본 `tables`의 select는 그 밥상에
속한 사람으로 제한합니다.

```sql
create view public.tables_public as
  select id, menu_id, host_id, host_name, host_verified, host_kind,
         date, time, place, restaurant, seats, note, guides, languages,
         lat, lng, is_sample, cancelled_at, created_at,
         (host_gender = 'Woman'
          or exists (select 1 from public.signups s
                     where s.table_id = tables.id and s.gender = 'Woman')) as has_woman
  from public.tables;
```

**주의 — 이건 초안이고 아직 안 돌려봤습니다.** 어제 검증 없이 정책을
올려서 앱을 세웠습니다. 이번에는 트랜잭션 안에서 실제로 읽어보고, 통과한
뒤에만 커밋합니다.

### 클라이언트도 바뀝니다

순수 SQL로 끝나지 않습니다. 목록은 뷰를 읽고, 상세는 원본을 읽어야 합니다
(`tableRepository.js`, `tableMapping.js`). 그래서 순서는:

1. 뷰 생성 + grant — **추가만 하므로 아무것도 안 깨짐**
2. 클라이언트를 뷰로 전환해서 배포
3. 원본 `tables`의 select 정책을 조이기

각 단계 사이에 앱이 정상인지 확인하고 넘어갑니다. 3단계만 되돌리면
언제든 지금 상태로 복귀합니다.

---

## 결정해 주실 것

1. 위 공개/비공개 분할에 동의하십니까?
2. `host_gender` → `has_woman` 파생값 교체에 동의하십니까? (상세에서도
   호스트 성별이 안 보이게 됩니다)
3. `note`(호스트가 밥상에 대해 쓴 소개)는 공개가 맞습니까? 지금은
   상세에서만 렌더되지만, 상세는 신청 전에도 볼 수 있는 화면입니다.

답 주시면 SQL 쓰고, 트랜잭션 안에서 검증해서 결과부터 보여드리겠습니다.
