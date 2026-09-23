# recipe-web

Next.js 기반 레시피 웹 프로젝트.

- Next.js (App Router, TypeScript)
- pnpm
- Tailwind CSS
- Zod
- Axios
- Zustand

## 구조

pnpm 워크스페이스 기반 모노레포입니다.

```
apps/
  web/           # Next.js 앱 (App Router)
    src/
      app/         # 라우트, 레이아웃, 페이지
      components/  # 앱 전용 컴포넌트
      hooks/       # 앱 전용 훅
      lib/         # 앱 전용 유틸리티
      store/       # Zustand 스토어
      types/       # 앱 전용 타입
      constants/   # 앱 전용 상수
packages/
  api/           # @recipe-web/api — axios 클라이언트, Zod 스키마
  ui/            # @recipe-web/ui — 공용 UI 컴포넌트
```

`apps/web`은 `@recipe-web/api`, `@recipe-web/ui`를 `workspace:*`로 참조합니다.

컨벤션은 [docs/branch-convention.md](docs/branch-convention.md), [docs/commit-convention.md](docs/commit-convention.md), [docs/code-convention.md](docs/code-convention.md)를 참고합니다.

## 시작하기

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인합니다.

## 검사

```bash
pnpm lint     # eslint 검사
pnpm build    # 프로덕션 빌드로 타입/빌드 오류 검사
```
