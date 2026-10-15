# 체크리스트 아이템 드래그 앤 드롭 버그 수정

## 대상 파일
`frontend/src/features/checklists/ChecklistItemRow.tsx`

## 원인
`handleDragStart`에서 `handleRef.current?.contains(event.target as Node)`로
"그립 핸들에서 드래그가 시작됐는지"를 판단하려 했으나, HTML5 Drag and Drop 스펙상
`dragstart` 이벤트의 `event.target`은 항상 `draggable="true"`인 요소(바깥쪽 `div`)
자신이며, 실제 마우스를 누른 하위 요소(그립 핸들 버튼)가 아니다. 따라서 이 조건은
항상 false가 되어 `event.preventDefault()`가 매번 호출되고, 드래그가 시작 단계에서
100% 취소되는 상태였다.

## 수정 내용
`dragstart` 시점이 아니라 그 이전 `mousedown` 시점에 "그립 핸들에서 눌렀는지"를
별도 ref(`allowDragRef`)로 기록하는 표준 패턴으로 변경.

1. `allowDragRef = useRef(false)` 추가.
2. 그립 핸들 버튼에 `onMouseDown={() => { allowDragRef.current = true }}` 추가.
3. `handleDragStart`에서 `handleRef.current?.contains(...)` 대신
   `allowDragRef.current` 체크로 교체 — false면 `preventDefault()` 후 return,
   true면 기존대로 `onDragStart(item.id)` 호출.
4. 바깥 `div`의 `onDragEnd`를 새 `handleDragEnd` 함수로 교체 —
   `allowDragRef.current = false`로 리셋한 뒤 기존 부모 `onDragEnd()` 콜백 호출.
5. 바깥 `div`에 `onMouseUp={handleMouseUp}`을 추가 —
   드래그 없이 클릭만 하고 끝난 경우에도 `allowDragRef.current`를 false로 리셋해서,
   핸들이 아닌 다른 곳(체크박스, 텍스트, 위/아래/삭제 버튼)에서 시작된 드래그가
   실수로 허용되지 않도록 함.

기존 `handleRef`(그립 핸들 DOM 참조)는 그대로 유지했으며 `ChecklistsPage.tsx`의
`onDragStart`/`onDragOverItem`/`onDrop`/`onDragEnd` 시그니처는 전혀 변경하지 않았다.
새 npm 의존성 없이 네이티브 HTML5 DnD만 사용.

## 검증
- `npx tsc --noEmit -p tsconfig.app.json` 실행 결과 타입 에러 없음.
- 브라우저 실전 드래그 동작 테스트(Playwright)는 수행하지 않음 — 다음 단계 에이전트가 진행.

## 커밋 여부
이번 작업에서는 git 커밋을 수행하지 않음(사용자 지침: 명시적 요청 시에만 커밋).
