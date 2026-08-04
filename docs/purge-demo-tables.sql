-- 검증용 밥상 정리 · Purge the verification tables
--
-- 2026-08-04 기준 프로덕션에 밥상 13개가 있었고 그중 12개가 검증 중에
-- 만들어진 것입니다. 호스트는 전부 "데모호스트", 만나는 곳은 "검증용 홍대입구",
-- "마감검증용", "사진검증용" 같은 이름입니다.
--
-- 외국인 여행자에게는 읽히지도 않고, 한국인에게는 "검증용 홍대입구에서
-- 만나자"로 읽힙니다. 어느 쪽이든 파일럿에 내보낼 수 없는 화면입니다.
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → 붙여넣고 Run.
--
-- ⚠ 크롬 자동번역을 끄고 실행하세요. 번역이 켜져 있으면 대시보드가
--   죽습니다 (SQL 자체는 실행되지만 화면만 멈춥니다).

-- ── 1단계: 지우기 전에 무엇이 지워질지 먼저 봅니다 ────────────────────
-- 이것만 먼저 실행해서 목록을 확인하세요. 여기서 이상한 게 보이면 멈추세요.

select
  t.id,
  t.date,
  t.time,
  t.place,
  t.host_name,
  (select count(*) from public.signups s where s.table_id = t.id) as 참석자
from public.tables t
where t.host_name = '데모호스트'
   or t.place like '%검증용%'
order by t.date;

-- 기대: 12행. 전부 host_name = '데모호스트'.
-- 조강민 님이 만드신 발우공양 밥상(2026-08-06, 5F Templestay Information
-- Center)은 이 목록에 없어야 합니다 — 있으면 아래를 실행하지 마세요.


-- ── 2단계: 둘 중 하나를 고릅니다 ──────────────────────────────────────

-- ▸ 방법 A — 지웁니다. 애초에 없었어야 할 데이터에는 이쪽이 정직합니다.
--   '취소'로 처리하면 "호스트가 약속을 깼다"는 기록 11건이 남는데,
--   그건 일어나지 않은 일입니다.
--
--   signups·reviews는 외래키가 on delete cascade 이므로 같이 지워집니다.
--   (사진검증용 밥상에 제 테스트 계정의 후기가 하나 붙어 있습니다.)

-- delete from public.tables
-- where host_name = '데모호스트'
--    or place like '%검증용%';


-- ▸ 방법 B — 남기되 정직하게 표시합니다.
--   시연 화면에 밥상이 몇 개는 보여야 한다면 이쪽입니다. is_sample 이 켜지면
--   카드에 'sample' 배지가 붙어서, 지어낸 사람을 진짜 사용자인 척
--   내보내지 않게 됩니다 (README의 정직성 규칙).
--
--   이 컬럼은 supabase/schema.sql 을 다시 실행해야 생깁니다.

-- update public.tables
-- set is_sample = true
-- where host_name = '데모호스트'
--    or place like '%검증용%';


-- ── 3단계: 확인 ───────────────────────────────────────────────────────
-- select count(*) as 남은_밥상, count(*) filter (where is_sample) as 샘플표시
-- from public.tables;
--
-- 방법 A 를 골랐다면: 남은_밥상 = 1 (조강민 님 것)
-- 방법 B 를 골랐다면: 남은_밥상 = 13, 샘플표시 = 12


-- ── 왜 이 파일이 생겼는지 ─────────────────────────────────────────────
--
-- 원래는 이런 일이 벌어져도 화면이 스스로 말해줬어야 합니다. README에
-- 규칙이 이렇게 적혀 있습니다:
--
--   "Seeded example tables are marked isSample; a demo that quietly passes
--    off invented strangers as real users is the one thing this screen must
--    not do."
--
-- 그런데 src/data/tableMapping.js 가 데이터베이스에서 읽은 모든 행에
-- isSample: false 를 그냥 박아 넣고 있었습니다. "데이터베이스에는 샘플이
-- 없다"는 주석과 함께요 — 쓸 당시엔 맞았고, 그 뒤로 계속 틀렸습니다.
-- 그래서 UI의 sample 배지는 프로덕션에서 켜질 수가 없었고, 지어낸 밥상
-- 12개가 몇 달째 누군가의 진짜 저녁인 척 서 있었습니다.
--
-- 그 부분은 고쳤습니다(is_sample 컬럼 + 매핑 + 테스트 2개). 이 파일은
-- 이미 들어가 있는 행을 치우는 몫입니다.
