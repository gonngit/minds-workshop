/* ============================================================
   네이버 지도 설정
   ------------------------------------------------------------
   발급 방법 (약 5분):
   1. https://console.ncloud.com 로그인 (네이버클라우드)
   2. Services → AI·NAVER API → Maps → 이용 신청
   3. Application 등록 → Web Dynamic Map 선택
   4. Web 서비스 URL에 추가:
      - https://gonngit.github.io
      - http://localhost:8000  (로컬 테스트용)
   5. 발급된 Client ID를 아래 따옴표 안에 붙여넣기

   비워두면 구글 지도 임베드로 자동 폴백됩니다.
   ============================================================ */
const NAVER_MAP_CLIENT_ID = "";
