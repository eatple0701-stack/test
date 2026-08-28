# Google 로그인 켜는 법 (15분, 두 사이트 왕복)

앱 코드는 이미 준비되어 있습니다 — 로그인 시트의 "Google로 계속" 버튼이
설정만 기다리는 중입니다. 설정 전까지는 "Google sign-in is not switched on"
이라고 정중히 안내합니다.

## 1부. Google Cloud Console — 열쇠 만들기

1. https://console.cloud.google.com 접속 (eatple0701 계정 추천)
2. 상단 프로젝트 선택 → **새 프로젝트** → 이름 `bapchingu` → 만들기
3. 왼쪽 메뉴 **API 및 서비스 → OAuth 동의 화면**:
   - User Type: **외부(External)** → 만들기
   - 앱 이름 `밥친구 잇플 · Eatple`, 사용자 지원 이메일 `eatple0701@gmail.com`,
     개발자 연락처 동일 → 저장 (나머지 단계는 기본값으로 통과)
   - "테스트" 상태여도 됩니다 — 게시 전에는 테스트 사용자 100명까지 로그인
     가능하니, **테스트 사용자에 팀원·시연 계정 이메일을 추가**해 두세요
4. **API 및 서비스 → 사용자 인증 정보 → + 사용자 인증 정보 만들기 →
   OAuth 클라이언트 ID**:
   - 애플리케이션 유형: **웹 애플리케이션**
   - 이름: `bapchingu-web`
   - **승인된 리디렉션 URI**에 정확히 이것 하나 추가:
     `https://zqpxyhygvenlcjaoxcns.supabase.co/auth/v1/callback`
   - 만들기 → **클라이언트 ID**와 **클라이언트 보안 비밀** 두 값이 나옴
     (이 창을 닫지 말고 다음 단계로)

## 2부. Supabase — 열쇠 꽂기

1. Supabase 대시보드 → **Authentication → Sign In / Providers → Google**
2. **Enable** 켜기
3. 1부에서 받은 **Client ID / Client Secret** 붙여넣기 → **Save**
4. **Authentication → URL Configuration**:
   - Site URL: `https://eatple.vercel.app`
   - Redirect URLs에 추가: `http://localhost:5177` (로컬 개발용)

## 확인

프로덕션에서 로그인 → "Google로 계속" 클릭 → 구글 계정 선택 화면으로
넘어가면 성공. 구글에서 돌아오면 전화번호·생년월일을 묻는 "거의 다
됐어요" 단계가 자동으로 뜹니다 (구글은 그 두 정보를 안 주므로 — 이미
구현되어 있음).

## 왜 이 구조인가

리디렉션 URI가 Supabase 주소인 이유: 구글은 Supabase에게 사용자를
돌려주고, Supabase가 세션을 만들어 앱으로 보냅니다. 앱 주소를 구글에
등록하는 게 아닙니다 — 앱 주소는 Supabase의 URL Configuration이
담당합니다.
