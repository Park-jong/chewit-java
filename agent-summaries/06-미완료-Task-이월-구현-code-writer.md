# 미완료 Task 이월(Carry over) 구현 (code-writer)

## API
`POST /api/tasks/carry-over`
- 요청: `{ fromDate, toDate }` (둘 다 @NotNull, ISO 날짜)
- 응답 200: `{ movedCount, toDate }`
- fromDate == toDate 이면 400, 필드 누락 시 400
- 해당 유저의 fromDate 날짜 `done=false` Task의 date만 toDate로 변경한다(move, id 유지). dirty checking 사용.

## 변경/추가 파일
백엔드 (`backend/src/main/java/com/chewworld/chewit/`)
- `exception/InvalidRequestException.java` (신규)
- `exception/GlobalExceptionHandler.java` — `InvalidRequestException` -> 400 핸들러 추가
- `dto/TaskDtos.java` — `CarryOverRequest`, `CarryOverResponse` 추가
- `repository/TaskRepository.java` — `findByUser_IdAndDateAndDoneFalse`
- `service/TaskService.java`, `service/TaskServiceImpl.java` — `carryOver`
- `controller/TaskController.java` — `POST /carry-over`

백엔드 테스트 (`backend/src/test/java/com/chewworld/chewit/`)
- `service/TaskServiceImplTest.java` — carryOver 5건
- `controller/TaskControllerTest.java` — 200 / 필드 누락 400 / 같은 날짜 400, 3건

프론트 (`frontend/src/`)
- `features/tasks/types.ts`, `api.ts`(`carryOverTasks`), `hooks.ts`(`useCarryOverTasksMutation`)
- `features/tasks/TaskItem.tsx` — 미완료 Task에만 "내일로" 버튼(lucide `CalendarArrowUp` + 텍스트, ghost/sm). `onMoveToTomorrow(task)` prop 추가
- `routes/DashboardPage.tsx` — 미완료가 1개 이상이면 "미완료 N개 다음 날로 이월" 버튼, 성공 시 `N개를 이월했어요` 토스트. 개별 이월은 기존 `useUpdateTaskMutation`으로 date만 `addDaysISO(task.date, 1)`로 변경(title/memo 유지). 두 mutation의 pending 상태를 `isMutating`에 포함
- `features/tasks/api.test.ts` — carryOverTasks 테스트 1건

## 결정 사항
- GlobalExceptionHandler에 IllegalArgumentException 핸들러가 없었다. 전역 IAE->400을 추가하면 Spring/JPA 내부 IAE까지 400으로 가려질 수 있어서, 전용 `InvalidRequestException`을 만들고 핸들러를 같이 추가했다(/error forward 401 마스킹 방지).
- 서비스 테스트는 Mockito 기반이라 "완료 건 유지 / 다른 유저 미변경"은 리포지토리 쿼리 계약(done=false + userId 필터)을 전제로 한 간접 검증이다. 실제 쿼리 동작은 통합 테스트 영역이다.
- `TaskItem`의 `onMoveToTomorrow` prop은 필수로 추가했다(사용처는 DashboardPage 하나뿐).
- shadcn 신규 컴포넌트 추가 없음.

## 확인
- `./gradlew compileJava compileTestJava` 통과
- `npx tsc -b` 통과
- 테스트 실행, 리뷰, git commit은 하지 않음(verifier 단계 몫)
