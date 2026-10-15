# 체크리스트 아이템 드래그 앤 드롭 정렬 추가

## 작업 내용
체크리스트 아이템 정렬을 기존 위/아래 버튼 방식에 더해 네이티브 HTML5 Drag and Drop API로도 가능하도록 개선했습니다. 새 npm 패키지는 추가하지 않았습니다.

## 변경 파일

### `frontend/src/features/checklists/ChecklistItemRow.tsx`
- `lucide-react`에서 `GripVertical` 아이콘을 임포트해 행 왼쪽에 드래그 핸들 버튼으로 추가.
- 행 컨테이너에 `draggable`, `onDragStart`, `onDragOver`, `onDrop`, `onDragEnd` 핸들러 추가.
- `useRef<HTMLButtonElement>`로 핸들 버튼을 참조해, `onDragStart`에서 `event.target`이 핸들 내부가 아니면 `event.preventDefault()`로 드래그를 취소 — 체크박스 클릭/텍스트 선택과 충돌하지 않도록 핸들에서만 드래그가 시작되게 함.
- `isDragging`(드래그 중인 행), `isDragOver`(드롭 대상 위에 있는 행) prop을 받아 각각 `opacity-50`, `border-primary` Tailwind 클래스로 시각적 피드백 제공.
- `disabled`일 때 `draggable={false}` 및 핸들 버튼도 `disabled` 처리(커서/opacity 스타일 포함)해 기존 버튼들과 동일한 기준으로 드래그를 막음.
- 기존 `ChevronUp`/`ChevronDown` 위·아래 이동 버튼은 그대로 유지(접근성 대체 수단).
- Props 인터페이스에 `isDragging`, `isDragOver`, `onDragStart`, `onDragOverItem`, `onDrop`, `onDragEnd` 추가.

### `frontend/src/routes/ChecklistsPage.tsx`
- 드래그 상태를 위한 로컬 state 3개 추가: `draggedChecklistId`, `draggedItemId`, `dragOverItemId`.
- 새 핸들러 4개 추가:
  - `handleItemDragStart(checklistId, itemId)`: 드래그 시작한 아이템/체크리스트 기록.
  - `handleItemDragOver(checklistId, itemId)`: 같은 체크리스트 내에서만 드롭 대상 하이라이트 갱신(다른 체크리스트로의 드래그는 무시).
  - `handleItemDragEnd()`: 드래그 관련 state 초기화.
  - `handleItemDrop(checklist, targetItemId)`: `draggedItemId`를 기존 `handleMove`와 동일한 패턴으로 `checklist.items` 배열에서 splice로 제거 후 target 위치에 삽입해 새 순서 배열을 만들고, 기존 `reorderItems` mutation(`useReorderChecklistItemsMutation`)으로 그대로 전송. 실패 시 `toast.error(getErrorMessage(error, '순서 변경에 실패했습니다.'))` — 기존 `handleMove`의 에러 처리 패턴을 그대로 재사용.
- `ChecklistItemRow` 렌더링부에 위 상태/핸들러들을 새 prop으로 연결.

## 서버/API 레이어
전혀 수정하지 않음. 기존 `PATCH /checklists/{id}/items/reorder` 엔드포인트와 `useReorderChecklistItemsMutation` 훅을 그대로 재사용.

## 검증
- `npx tsc --noEmit -p tsconfig.app.json` — 에러 없음.
- `npx oxlint src/features/checklists/ChecklistItemRow.tsx src/routes/ChecklistsPage.tsx` — 에러 없음(exit 0).
- 기존 `frontend/src/features/checklists/api.test.ts`는 API 레이어라 건드리지 않았으며, 이번 변경은 컴포넌트 레이어에만 국한되어 영향 없음.
- 별도 테스트 실행(vitest 등)이나 수동 UX 검증은 진행하지 않음 — 다음 단계(리뷰/테스트 에이전트)에서 수행 예정.
