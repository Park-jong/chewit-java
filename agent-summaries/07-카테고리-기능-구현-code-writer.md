# 카테고리 기능 구현 (code-writer)

날짜: 2026-09-21
상태: 구현 + 컴파일 확인만 완료 (`./gradlew compileJava compileTestJava` 통과, `npx tsc -b` 통과). 테스트 실행/리뷰는 미수행(verifier 담당). git commit/push 안 함.

## 백엔드

### 신규 파일 (`backend/src/main/java/com/chewworld/chewit/`)
- `entity/Category.java`: id(IDENTITY), user(LAZY), name(length 30), color(length 7), createdAt. 테이블명 `categories`.
- `dto/CategoryDtos.java`: `CreateCategoryRequest`, `UpdateCategoryRequest`(name `@NotBlank @Size(max=30)`, color `@NotBlank @Pattern(^#[0-9a-fA-F]{6}$)`), `CategoryResponse(id,name,color,createdAt)`, `CategorySummary(id,name,color)` + `CategorySummary.from(Category)`(null-safe).
- `exception/DuplicateCategoryException.java` + `GlobalExceptionHandler`에 409 핸들러 추가(`handleDuplicateCategory`).
- `repository/CategoryRepository.java`: `findByUser_IdOrderByCreatedAtAsc`, `findByIdAndUser_Id`, `existsByUser_IdAndName`.
- `service/CategoryService.java`(인터페이스) + `CategoryServiceImpl.java`. 공통 헬퍼 `Category resolveOwned(Long userId, Long categoryId)`: categoryId==null이면 null 반환, 없거나 타인 소유면 ResourceNotFoundException(404).
- `controller/CategoryController.java`: 인터페이스 없이 단일 클래스.

### 수정 파일
- `entity/Task|Event|Checklist.java`: nullable `@ManyToOne(LAZY) @JoinColumn(name="category_id") Category category` 추가. (빌더/생성자 호출부 깨짐 없음, main+test 컴파일 확인)
- `repository/Task|Event|ChecklistRepository.java`: `@Modifying(flushAutomatically=true, clearAutomatically=true) @Query("update X set x.category = null where x.category.id = :categoryId") void clearCategory(...)` 추가. 목록 조회 메서드(`findByUser_IdAndDateOrderByCreatedAtAsc`, `findByUser_IdOrderByDateAsc`, `findByUser_IdOrderByCreatedAtAsc`)에 `@EntityGraph(attributePaths="category")` 적용(N+1 방지).
- `dto/TaskDtos|EventDtos|ChecklistDtos.java`: Create/Update Request 끝에 `Long categoryId` 추가, Response 끝에 `CategorySummary category` 추가.
- `service/TaskServiceImpl|EventServiceImpl|ChecklistServiceImpl.java`: `CategoryService` 주입, create/update(rename)에서 `categoryService.resolveOwned(userId, request.categoryId())` 결과를 세팅(null이면 해제). toResponse에 `CategorySummary.from(...)`.
- Calendar/Stats 서비스는 Task 엔티티/`EventResponse`의 필요한 필드만 쓰므로 코드 수정 불필요(테스트의 EventResponse 생성자 호출만 갱신).

### API 스펙 (`/api/categories`, 모두 인증 필요)
| 메서드 | 경로 | 요청 | 응답 |
|---|---|---|---|
| GET | `/api/categories` | - | `CategoryResponse[]` (생성순) |
| POST | `/api/categories` | `{name, color}` | `CategoryResponse` (중복 이름 409) |
| PATCH | `/api/categories/{id}` | `{name, color}` (둘 다 필수, 전체 교체) | `CategoryResponse` (없음/타인 404, 다른 카테고리와 이름 중복 409) |
| DELETE | `/api/categories/{id}` | - | 200 (Task/Event/Checklist의 category를 null로 정리 후 삭제; 없음/타인 404) |

검증 실패는 400(기존 handleValidation). Task/Event/Checklist의 요청 DTO는 선택 `categoryId`, 응답 DTO는 `category: {id,name,color} | null`.

## 프론트엔드

### 신규
- `features/categories/`: `types.ts`(Category, CategorySummary, 요청 타입, `CATEGORY_COLORS` 8색 프리셋, `CATEGORY_NAME_MAX_LENGTH`), `api.ts`, `hooks.ts`(쿼리 키 `['categories']`; mutation 성공 시 `['categories']`,`['tasks']`,`['events']`,`['checklists']` 모두 invalidate), `CategoryBadge.tsx`(색 점+이름, null이면 미렌더), `CategorySelect.tsx`(native `<select>`, "카테고리 없음" 옵션, aria-label "카테고리"), `ColorSwatches.tsx`(프리셋 스와치 버튼, aria-pressed), `AddCategoryForm.tsx`, `CategoryRow.tsx`(보기/수정 토글, 수정/삭제 버튼), `api.test.ts`.
- `routes/CategoriesPage.tsx`: 목록/추가/이름·색 수정/삭제(`window.confirm` 후 삭제).

### 수정
- `App.tsx`: `/categories` 라우트(ProtectedRoute 하위). `NavBar.tsx`: "카테고리" 탭 추가(`NAV_ITEMS`는 `as const` 대신 `NavItem[]` 명시 타입으로 변경). `NavBar.test.tsx`: 카테고리 탭 케이스 추가.
- tasks/events/checklists `types.ts`: `category: CategorySummary | null`, 요청에 `categoryId?: number | null`.
- `AddTaskForm`, `AddEventForm`, `AddChecklistForm`: `categories` prop + `CategorySelect`, `onAdd`가 categoryId를 추가 인자로 받음.
- `TaskItem`, `EventItem`, ChecklistsPage 카드, Dashboard의 "이 날의 이벤트" 항목에 `CategoryBadge` 표시.
- `ChecklistsPage`: 펼친 패널에 카테고리 셀렉트 추가(변경 즉시 rename API로 저장). 이름 변경 submit 시에도 기존 `categoryId`를 함께 전송(해제 방지).
- `DashboardPage`: `handleMoveToTomorrow`가 `categoryId: task.category?.id ?? null` 함께 전송(중요 요건 반영). 카테고리 필터 칩(전체 + 각 카테고리, 카테고리가 0개면 숨김, 클라이언트 필터). "미완료 N개 이월" N은 필터와 무관하게 `tasksQuery.data` 전체 미완료 수 유지.
- `EventsPage`: `useCategoriesQuery` 사용, 생성 시 categoryId 전송.
- 테스트 갱신: tasks/events/checklists `api.test.ts`(sample에 `category: null`, categoryId 전달 케이스 추가), `EventsPage.test.tsx`/`ChecklistsPage.test.tsx`(`@/features/categories/hooks` mock 추가 — 안 하면 QueryClientProvider 없어 실패, EventsPage 생성 기대값에 `categoryId: null` 추가).

## 백엔드 테스트 (작성만, 실행 안 함)
- 신규: `service/CategoryServiceImplTest`(생성/중복/수정/이름 유지 시 중복검사 생략/타 카테고리와 중복/삭제 시 clearCategory 3종 호출 후 deleteById 순서/타인 404/resolveOwned), `controller/CategoryControllerTest`(list/create/update/delete, 검증 400(공백·31자·색 형식), 중복 409, 404).
- 갱신: Task/Event/Checklist Service·Controller 테스트의 DTO 생성자 시그니처 갱신(위치 인자 `null` 추가), 서비스 테스트에 `@Mock CategoryService` 추가 및 카테고리 부착/해제/타인 카테고리 예외 케이스 각 서비스별 추가, `TaskControllerTest`에 categoryId 응답/404 케이스 추가. Calendar/Stats 서비스 테스트의 `EventResponse` 생성자 인자 갱신.

## 결정 사항 / 우려
- 이름은 서비스에서 `strip()` 후 저장·중복 검사. 대소문자 구분(DB 유니크 제약은 없음, 서비스 레벨 검사만이므로 동시 요청 경쟁은 이론상 가능).
- 삭제는 벌크 update의 `clearAutomatically`가 영속성 컨텍스트를 비우므로 `delete(entity)` 대신 `deleteById`를 사용. 통합(실 DB) 환경에서 삭제 → 참조 항목 null 반영은 단위 테스트로 검증되지 않으므로 verifier가 실제 실행 확인 권장(Hibernate 7의 `set t.category = null` HQL 동작).
- `ddl-auto=update`라 기존 tasks/events/checklists 테이블에 `category_id` 컬럼(nullable, FK)이 자동 추가됨.
- `CategorySelect`는 카테고리가 0개면 아무것도 렌더링하지 않음(선택지가 "없음"뿐이라). 페이지가 `useCategoriesQuery`로 목록을 받아 props로 내려주는 구조(컴포넌트 자체는 프레젠테이션 전용).
- 카테고리 색상 표시는 Task/Event/Checklist 목록·이벤트 항목에만 적용. Calendar 월간 API/화면(`CalendarTaskItem` 등)은 이번 범위에서 카테고리 미반영. EventsPage 월간 그리드 셀에도 색 표시 없음.
- Task/Event에는 수정 폼이 없어 카테고리 변경 UI는 체크리스트(펼침 패널)에만 있음. Task/Event의 카테고리는 생성 시에만 지정 가능(삭제 후 재생성 필요).
- 작업 트리에 이전 이월(carry-over) 작업분이 미커밋 상태로 남아 있어 `git diff`에 그 변경도 섞여 보임(이번 작업과 무관).
