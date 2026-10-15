# M7 다듬기 누락분 재적용 (code-writer)

모든 편집 후 grep으로 디스크 반영을 확인했다. 범위 밖 변경 없음, git 명령 미실행, 서버 미조작.

| # | 항목 | 결과 | 디스크 반영 근거 |
| --- | --- | --- | --- |
| 1 | 오류 JSON 통일 | 완료. `writeError()` 헬퍼 추가. ObjectMapper 대신 `Instant.now()` ISO 문자열을 직접 직렬화(GlobalExceptionHandler와 동일한 `Instant.toString()` 형식). Content-Type `application/json;charset=UTF-8`, status/message 값 불변 | SecurityConfig.java:47,49 (호출), :57 (정의), :63 (timestamp), :20 (import Instant). AuthSecurityRulesTest.java:50 `$.timestamp` 존재 단언 + `$.status` 401 단언 |
| 2 | 유효 JWT로 /me 200 | 완료. 실제 JwtAuthenticationFilter 경유, JwtTokenProvider/UserRepository mock, 프로덕션 변경 없음 | AuthSecurityRulesTest.java:54 (`me는_유효한_토큰이면_200과_사용자_정보를_반환한다`), :62 `isOk` |
| 3 | 405 Allow 헤더 | 완료. null/empty면 생략 | GlobalExceptionHandler.java:41 `getSupportedHttpMethods()`, :43 `builder.allow(...)`. FrameworkExceptionHandlingTest.java:45 `header().string("Allow", ...)` (+ `$.message` 단언) |
| 4 | 테스트 이름 정정 | 확인 결과 이미 반영되어 있었음(추가 변경 없음). 두 테스트 모두 override 검증은 EventServiceImplTest 담당이라는 주석 존재 | CalendarServiceImplTest.java:89 `getMonth_EventService가_반환한_회차를_날짜별로_그룹핑한다`, :90 주석. StatsServiceImplTest.java:137 `monthly_이벤트_건수는_EventService_listByMonth_결과_크기를_사용한다`, :138 주석 |
| 5 | 루트 README | 완료. StatsController는 `@RequestParam(required=false) String month`, 생략 시 `YearMonth.now()` 임을 코드로 확인 후 반영 | README.md:13 (Event 설명), :148 (occurrences PATCH/DELETE), :152 (stats `month=YYYY-MM`, 생략 시 현재 월), :159 (override 테이블/초기화/overridden), :161 (오류 응답 형식·401·404·405) |

## 검증
- `./gradlew.bat test --rerun-tasks`: BUILD SUCCESSFUL (AuthSecurityRulesTest 4건 모두 통과)
- frontend `npm test`: 19 files / 90 tests 통과, `npx tsc -b` 오류 없음, `npm run lint`: 기존 경고 5건만

## 참고
- README의 override 설명은 `EventOccurrenceOverride` 엔티티 필드(skipped, title, memo)를 근거로 작성했다.
