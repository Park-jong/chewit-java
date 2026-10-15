# chewit frontend

chewit 플래너 앱의 React SPA입니다. 프로젝트 개요와 백엔드 실행 방법은 [루트 README](../README.md)를 참고하세요.

## 스택

React 19, TypeScript, Vite, React Router, TanStack Query, react-hook-form + zod, Tailwind CSS v4, shadcn/ui, Recharts, Vitest

## 실행

```bash
npm install
npm run dev      # 개발 서버 (http://localhost:5173)
npm test         # Vitest 실행
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

개발 서버는 `/api` 요청을 `http://localhost:8080`(백엔드)으로 프록시합니다.

## 폴더 구조

```
src/
├─ features/    # 도메인별 api / hooks / types / 컴포넌트 (auth, tasks, routines, events, checklists, categories, calendar, stats)
├─ routes/      # 페이지 컴포넌트
├─ components/  # 공용 + shadcn/ui 컴포넌트
└─ lib/         # axios 인스턴스, 날짜 유틸 등
```
