# 체크리스트 드래그 앤 드롭 정렬 버그 수정 — 실제 브라우저 검증 (2026-09-19)

## 배경
이전 검증(`2026-09-19-checklist-dnd-verification.md`)은 정적 코드 리뷰(diff 대조 + 로직 수동 트레이스)만으로 "통과" 판정을 내렸으나,
`handleDragStart`가 `dragstart` 이벤트의 `event.target`(항상 draggable 요소 자신 = 바깥 div)을
그립 핸들 버튼과 `contains()` 비교하는 방식이었고, 이 비교는 HTML5 DnD 스펙상 항상 false가 되어
모든 드래그가 `preventDefault()`로 즉시 취소되는 버그를 놓쳤다. 사용자가 실제로 사용해보고서야 발견됨.

code-writer가 이를 "mousedown 시점에 `allowDragRef`(useRef)를 true로 세팅하고 dragstart에서 그 ref를 체크,
dragend/mouseup에서 false로 리셋"하는 방식으로 수정했다고 보고. 이번 작업은 **실제 Playwright chromium 브라우저로
마우스 기반 드래그를 수행하여 눈으로/데이터로 검증**하는 것이었다(정적 리뷰 재사용 금지 지시).

## 검증 방법
1. 백엔드(`localhost:8080`)에 로그인 → JWT 획득, `POST /api/checklists`로 테스트 체크리스트(id=8) 생성,
   `POST /api/checklists/8/items` x3로 "Item A"(id23), "Item B"(id24), "Item C"(id25) 순서로 아이템 생성.
2. Playwright 패키지 설치(scratchpad, `--no-save`). 캐시된 브라우저(chromium-1234)와 설치된 `playwright` 최신 버전(1.63.0, chromium rev 1243)이
   버전 불일치로 실행 실패 → 여러 playwright-core 버전을 `npm pack`으로 프로빙하여 chromium revision이 캐시(1234)와 일치하는
   `playwright@1.62.0`을 찾아 설치해 해결.
3. headless chromium으로 `http://localhost:5173`에 접속, `localStorage.setItem('chewit_token', <JWT>)`로 로그인 주입 후
   `/checklists`로 이동, 테스트 체크리스트 펼침.
4. **실제 마우스 이벤트 시퀀스**(`page.mouse.move` → `down` → 다단계 `move`(12 스텝) → `up`)로 그립 핸들(`aria-label="순서 변경 핸들"`,
   Item A 행 내부)에서 Item C 행까지 드래그 수행. `locator.dragTo()`가 아닌 저수준 마우스 API를 사용해 네이티브 HTML5 DnD 시퀀스를
   실제로 발생시킴(브라우저가 CDP Input 이벤트를 실제 드래그로 해석하는 방식이라 JS 합성 이벤트 디스패치와는 다른, 이전에 놓쳤던 브라우저 동작을 재현).
5. 드래그 전/후/새로고침 후/대조군 후 총 4장 스크린샷 캡처 + DOM에서 아이템 텍스트 순서 추출 + 콘솔 에러 수집.
6. 대조군: 그립 핸들이 아닌 아이템 텍스트 영역에서 동일한 마우스 드래그 시퀀스를 수행해 "핸들 전용" 제약이 유지되는지 확인.
7. 프론트엔드 `npm run test -- --run`과 `npx tsc --noEmit -p tsconfig.app.json` 재실행으로 회귀 확인.
8. `DELETE /api/checklists/8`로 테스트 데이터 정리, 목록에서 사라진 것 확인.

## 결과 — 드래그 앤 드롭 정상 작동 확인 (실제 브라우저 증거)

### 테스트 1: 그립 핸들에서 드래그 (Item A → Item C 위치)
- 드래그 전 DOM 순서: `["Item A", "Item B", "Item C"]`
- 그립 핸들 드래그 직후 DOM 순서: `["Item B", "Item C", "Item A"]` — **순서가 실제로 바뀜**
- 페이지 새로고침 후 DOM 순서: `["Item B", "Item C", "Item A"]` — **서버에 `PATCH /checklists/8/items/reorder`가 반영되어 유지됨**
- 백엔드 API(`GET /api/checklists`)로 독립적으로 재확인한 결과도 동일:
  ```
  sortOrder 0: Item B (id 24)
  sortOrder 1: Item C (id 25)
  sortOrder 2: Item A (id 23)
  ```
  → 프론트엔드 낙관적 업데이트가 아니라 DB에 실제로 영속화됨을 확인.
- 브라우저 콘솔 에러: 0건.
- 스크린샷(scratchpad, 세션 종료 후 사라짐 — 필요시 재실행으로 재생성 가능):
  - `01-before-drag.png`: Item A, B, C 순서
  - `02-after-grip-drag.png`: Item B, C, A 순서로 바뀜
  - `03-after-reload.png`: 새로고침 후에도 B, C, A 순서 유지

### 테스트 2 (대조군): 그립 핸들이 아닌 아이템 텍스트에서 드래그
- 드래그 전 순서: `["Item B", "Item C", "Item A"]`
- 텍스트 영역에서 동일한 마우스 드래그 시퀀스 수행 후 순서: `["Item B", "Item C", "Item A"]` — **변화 없음**
- → `allowDragRef`가 그립 핸들 `mousedown`에서만 true로 세팅되므로, 핸들이 아닌 곳에서 드래그를 시작하면
  `dragstart`에서 `preventDefault()`되어 드래그 자체가 무산됨. **"핸들 전용" 제약이 의도대로 유지됨.**

## 회귀 테스트
- `npm run test -- --run`: 16 test files, **62 tests 전부 통과**.
- `npx tsc --noEmit -p tsconfig.app.json`: 에러 없음.

## 결론
이전 정적 리뷰가 놓쳤던 `dragstart`/`event.target` HTML5 DnD 버그는 `allowDragRef` 방식으로 **실제로 수정되었음을
실제 브라우저 마우스 드래그로 확인**했다. 그립 핸들 드래그는 순서를 바꾸고 서버에 영속화되며, 핸들이 아닌 곳에서의 드래그는
여전히 차단된다. 회귀도 없음(단위/통합 테스트 62개 통과, 타입체크 통과).

## 부수적으로 발견한 이슈 (버그는 아니지만 기록)
- `GET /api/checklists/{id}` 단일 조회 엔드포인트가 존재하지 않음(컨트롤러에 미구현). 호출 시 `500 서버 오류가 발생했습니다`를 반환함
  (404가 아니라 500인 점은 다소 의아하지만, 프론트엔드는 이 엔드포인트를 쓰지 않고 `GET /api/checklists`(목록) 후 클라이언트에서
  필터링하는 방식을 쓰므로 실사용에는 영향 없음). 참고용으로만 기록.

## 코드 수정 여부
검증 과정에서 프로덕션 코드를 수정하지 않았음(읽기 전용 검증 + 테스트 데이터 생성/삭제만 수행).

## 테스트 데이터 정리
테스트로 생성한 체크리스트(id=8)와 아이템 3개는 `DELETE /api/checklists/8`로 삭제 완료. 삭제 후 목록 조회로 미존재 확인함.
