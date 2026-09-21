# 체크리스트 드래그 앤 드롭 정렬 기능 검증 (2026-09-19)

## 작업 개요
code-writer 에이전트가 체크리스트 아이템 정렬을 "위/아래 버튼"에서 "네이티브 HTML5 드래그 앤 드롭 + 기존 버튼 병행" 방식으로 바꾼 변경사항을 검증했다.
대상 파일:
- `frontend/src/features/checklists/ChecklistItemRow.tsx`
- `frontend/src/routes/ChecklistsPage.tsx`

## 검증 결과 요약 — 전부 통과, 발견된 버그 없음

1. **git diff 대조**: 보고된 내용과 실제 diff가 정확히 일치. GripVertical 드래그 핸들, draggable/onDragStart/onDragOver/onDrop/onDragEnd, isDragging/isDragOver 시각 피드백(opacity-50 / border-primary), disabled 시 draggable=false, 기존 ChevronUp/ChevronDown 버튼 유지 — 모두 확인됨.
2. **의존성**: `frontend/package.json`, `package-lock.json` diff 없음(0 변경). node_modules에도 dnd 관련 패키지 없음. 네이티브 HTML5 DnD만 사용한다는 요구사항 충족.
3. **접근성**: `ChecklistItemRow.tsx` 99~108번째 줄 부근에 ChevronUp("위로 이동")/ChevronDown("아래로 이동") 버튼이 그대로 남아 있고 `onMoveUp`/`onMoveDown`도 `ChecklistsPage.tsx`의 `handleMove`에 그대로 연결되어 있음.
4. **vitest**: `npm run test -- --run` → 16 test files, 62 tests 전부 통과(약 26초). `api.test.ts` 단독 실행도 9/9 통과.
5. **tsc**: `npx tsc --noEmit -p tsconfig.app.json` → 에러 없음.
6. **로직 리뷰**:
   - (a) 자기 자신 위 드롭: `handleItemDrop`에서 `sourceItemId === targetItemId`면 즉시 return, 뮤테이션 호출 없음 → 안전.
   - (b) splice 순서 재계산: `[...items]`에서 `splice(fromIndex,1)`로 제거 후 `splice(toIndex,0,moved)`로 삽입. 앞으로 이동(fromIndex<toIndex)과 뒤로 이동(fromIndex>toIndex) 양쪽 케이스를 손으로 추적한 결과 모두 올바른 순열을 생성함(예: [A,B,C,D]에서 A를 C 위로 드롭 → [B,C,A,D], D를 B 위로 드롭 → [A,D,B,C]). 인덱스 범위를 벗어나거나 아이템이 중복/소실되는 경우 없음.
   - (c) 체크리스트 간 드래그: `handleItemDragOver`가 `checklistId !== draggedChecklistId`면 무시하여 다른 체크리스트로는 drag-over 시각 피드백조차 발생하지 않음. 설령 `handleItemDrop`이 다른 체크리스트 컨텍스트에서 호출되더라도 `items.findIndex`가 -1을 반환하므로 조용히 return되어 크래시나 오동작 없음.
   - (d) disabled 상태 차단: 외곽 `<div draggable={!disabled}>`로 뮤테이션 진행 중(`isItemMutating`, `reorderItems.isPending` 포함)에는 네이티브 드래그 자체가 시작되지 않음. 핸들 버튼도 `disabled` 처리됨.
   - 부가 확인: 드래그는 GripVertical 핸들에서 시작한 경우에만 허용되도록 `handleDragStart`에서 `handleRef.current?.contains(event.target)` 체크 후 아니면 `event.preventDefault()` 하는 표준적인 "핸들 전용 드래그" 패턴을 올바르게 구현함. `onDragOver`에서 `event.preventDefault()`를 호출해 drop이 실제로 발생하도록 처리한 것도 정확함.
   - 기존 `useReorderChecklistItemsMutation`은 optimistic update 없이 성공 시 invalidate만 하는 패턴이며, 새 `handleItemDrop`도 기존 `handleMove`와 동일한 패턴을 그대로 재사용해 회귀 위험 없음.

## 테스트 공백(버그는 아니지만 참고)
- `ChecklistsPage.test.tsx`에 드래그 앤 드롭 관련 테스트가 전혀 없음(grep 결과 0건). 새 기능 자체에 대한 자동화 테스트 커버리지는 없는 상태이며, 기존 버튼 기반 정렬(`handleMove`) 테스트만 유지되는 것으로 보임. 필요 시 추가 테스트 작성을 권장하나 이번 지시 범위(회귀/로직 검증)에서는 실패로 간주하지 않음.

## 생략한 항목
- Playwright를 이용한 실제 브라우저 드래그 동작 검증은 시간 관계상 생략함. 정적 diff 검토, 타입체크, 유닛/통합 테스트, 코드 로직 수동 추적으로 충분한 신뢰도를 확보했다고 판단했으나, 네이티브 HTML5 dragstart/dragover/drop 이벤트가 실제 브라우저 좌표/DataTransfer 동작까지 완전히 검증된 것은 아님.

## 코드 수정 여부
검증 과정에서 코드를 수정하지 않았음(읽기 전용 검증).
