# M7 다듬기 재검증 (2회차) - code-verifier

## 요약
디스크 상태를 직접 확인한 결과 5개 재적용 항목이 모두 실제로 저장되어 있고 동작함. 차단급 결함 없음.

## 실행 결과
- 백엔드 `gradlew test --rerun-tasks`: 183 tests, 실패/에러/스킵 0, BUILD SUCCESSFUL
- 프론트 `npm test`: 19 files / 90 tests 통과, `tsc -b` 오류 0, oxlint 경고만(기존 only-export-components 등, 신규 없음)
- 실서버(8081, 종료 완료, 리슨 0 확인; 8080/5173 유지):
  - 무토큰 `/api/auth/me` -> 401, `Content-Type: application/json;charset=UTF-8`, `{"status":401,"message":"인증이 필요합니다.","timestamp":...Z}` 한글 정상
  - 잘못된 토큰 -> 401 동일 형식
  - 데모 로그인 토큰 -> `/api/auth/me` 200 (displayName "데모")
  - `PUT /api/tasks` -> 405, `Allow: GET,POST`, 본문 한글 정상
  - 없는 경로 -> 404 `요청한 경로를 찾을 수 없습니다.`

## 항목별 판정
1. SecurityConfig writeError: 통과. message는 코드 내 고정 상수 2개라 이스케이프 문제 없음. getWriter + charset=UTF-8 지정으로 한글 정상(실서버 확인). timestamp는 Instant.now() 문자열로 handler와 동일.
2. AuthSecurityRulesTest: 통과. 실제 JwtAuthenticationFilter를 사용하고 JwtTokenProvider/UserRepository만 mock. 필터가 isValid->getUserId->findById->principal 설정을 거쳐야 200이 되므로 의미 있음(토큰 미설정 시 401).
3. handleMethodNotSupported: 통과. null/empty 시 Allow 생략. 테스트에서 message와 Allow(PATCH) 단언.
4. Calendar/Stats 테스트: 통과. 기존 테스트는 EventResponse 생성자 인자(overridden=false)만 변경, 새 테스트 추가형이라 단언 약화 없음.
5. 루트 README: 통과. stats month 선택/현재월 기본, Event occurrences 엔드포인트, override 테이블명(event_occurrence_overrides), overridden 필드, 오류 형식 모두 코드와 일치. docs/screenshots 7개 이미지(dashboard, calendar, events, checklists, stats, categories, login) 모두 실제 존재.
6. frontend/README: package.json 스크립트/스택/vite 프록시(8080)와 일치. ChecklistsPage: 동일 id 드롭 시 reorderByDrag가 null -> API 호출 없이 종료, handleItemDragEnd()는 먼저 호출되어 보존.

## 결함/제안 (모두 낮음)
- [낮음] `GET /api/stats/monthly?month=abc` (events/calendar도 동일 추정) 는 YearMonth.parse 예외가 catch-all에 걸려 500 반환. 400이 적절. (DateTimeParseException 핸들러 또는 파라미터 타입 변경 제안) 이번 M7 범위 밖의 기존 동작.
- [낮음] SecurityConfig.writeError는 message가 고정 문자열일 때만 안전. 동적 message를 넘기도록 바뀌면 이스케이프 필요(주석으로 명시되어 있음).
- [정보] 401/403 본문 키 순서(status 먼저)가 handler 응답(Map, timestamp 먼저)과 달라도 JSON 의미상 무관.
