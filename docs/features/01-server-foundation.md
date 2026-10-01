# 01. 서버 기반 이식 설계

- 작성자: 김도혁
- 날짜: 2026-10-02

## 1. 개요

synergy-mvp의 서버 기능(Route Handler·Supabase 접근·세션 갱신)을 recipe-web에 옮기기 위한 공통 기반을 만든다.
recipe-web 화면은 이미 같은 도메인의 `/api/*`를 호출하고 있다. 하지만 앱 안에 서버가 없어서 홈 분석·북마크·탈퇴가 실제로 동작하지 않는다.

- 선행 문서: 없음
- 후속 문서: [02 분석 API](./02-analyze-api.md), [03 북마크·계정 API](./03-bookmark-api.md), [04 팬트리 API](./04-pantry-api.md)

## 2. 목표 / 비목표

### 목표

- 서버 전용 코드를 둘 위치와 규칙을 정한다.
- 요청마다 Supabase 세션 쿠키를 갱신하는 `proxy.ts`를 이식한다.
- 서버 전용 Supabase admin 클라이언트를 만든다.
- 서버 환경변수를 정리하고 `.env.example`에 문서화한다.
- MVP의 `supabase/migrations`를 recipe-web으로 옮겨 이후 마이그레이션을 이 저장소에서 관리한다.

### 비목표

- 개별 엔드포인트 구현. 02~04 문서에서 다룬다.
- 새 Supabase 프로젝트 생성. MVP와 같은 프로젝트를 쓴다.
- MVP 저장소의 코드 정리나 삭제.

## 3. 배경 / 현재 상태

| 항목 | recipe-web 현재 | MVP 원본 |
| --- | --- | --- |
| API 호출 | `getApiClient()`가 `baseURL: "/api"`로 고정 ([api-client.ts](../../apps/web/src/lib/api-client.ts)) | 같은 도메인 `/api/*` Route Handler |
| 세션 갱신 | 없음 | `src/proxy.ts` → `lib/supabase/middleware.ts`의 `updateSession` |
| Supabase 클라이언트 | 브라우저용 `lib/supabase/client.ts`, 서버용 `lib/supabase/server.ts` | 여기에 `lib/supabase/admin.ts`(secret 키, RLS 우회) 추가 |
| 인증 콜백 | `app/auth/callback/route.ts` 구현됨 | 같음 |
| 마이그레이션 | 없음 | `supabase/migrations/*` 5개 |
| 환경변수 | `NEXT_PUBLIC_API_BASE_URL`만 문서화됨. 코드는 이 값을 읽지 않음 | Supabase 3종 + 외부 API 키 5종 |

MVP와 달라지는 점:

- MVP는 서버 코드가 `src/lib/*`에 화면 코드와 섞여 있었다. recipe-web은 `src/server/`로 분리한다.
- MVP의 `env.js`(`.env` 직접 로드)는 Next.js가 환경변수를 주입하므로 쓰지 않는다. 02 문서에서 처리한다.

## 4. 요구사항

1. 서버 전용 코드는 클라이언트 번들에 포함되면 빌드가 실패해야 한다.
2. Route Handler는 쿠키 세션으로 사용자를 식별하고, 만료된 액세스 토큰은 요청 시점에 갱신되어야 한다.
3. secret 키는 `NEXT_PUBLIC_` 접두사 없이 서버에서만 읽는다.
4. 같은 DB를 쓰는 MVP 배포가 recipe-web의 마이그레이션 때문에 깨지면 안 된다.

## 5. 상세 설계

### 5.1 폴더 구조

```
apps/web/src/
  proxy.ts                    # 세션 갱신 진입점 (Next 16: middleware → proxy)
  server/                     # 서버 전용. 모든 진입 파일에 import "server-only"
    supabase/
      admin.ts                # secret 키 클라이언트 (RLS 우회)
      update-session.ts       # proxy에서 쓰는 세션 갱신
    recipe/                   # 02: PoC 파이프라인 (JS 그대로)
    adapters/                 # 02: 파이프라인 출력 → API 계약 변환
    data/                     # 03·04: bookmark, store-price, pantry 데이터 접근
  lib/supabase/server.ts      # 기존 유지. Route Handler·Server Component용 쿠키 클라이언트
supabase/
  config.toml
  migrations/                 # MVP에서 이전 + 신규
```

- `app/api/**/route.ts`는 얇게 유지한다. 입력 검증과 응답 변환만 하고, 실제 로직은 `server/`를 호출한다.
- `server/`는 React·`next/navigation`을 import하지 않는다. `next/headers`의 `cookies()`는 `lib/supabase/server.ts`를 통해서만 쓴다.

### 5.2 세션 갱신 (`proxy.ts`)

- MVP `proxy.ts`와 `updateSession`을 그대로 이식한다.
- 환경변수 이름은 recipe-web 기존 이름(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)과 같다.
- matcher는 정적 파일과 이미지를 제외한 전체 경로다.
- 이식 전에 `node_modules/next/dist/docs/`에서 proxy 규칙(파일 위치, export 이름)을 확인한다.

### 5.3 환경변수

| 키 | 공개 | 사용처 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 공개 | 기존 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 공개 | 기존 |
| `SUPABASE_SECRET_KEY` | 서버 | admin 클라이언트 (탈퇴, 별칭 캐시 쓰기) |
| `GEMINI_API_KEY` | 서버 | 02·04 LLM |
| `YOUTUBE_API_KEY` | 서버 | 02 영상 설명·댓글 |
| `KAMIS_CERT_KEY`, `KAMIS_CERT_ID` | 서버 | 02·04 농산물 시세 |
| `PRICE_GO_SERVICE_KEY` | 서버 | 02 공공 가격 데이터 |

- `NEXT_PUBLIC_API_BASE_URL`은 코드에서 읽지 않으므로 `.env.example`에서 삭제한다.
- 키가 비어 있을 때의 동작은 각 기능 문서에서 정한다. 원칙은 "금액을 지어내지 않고 실패를 드러낸다"이다.

### 5.4 마이그레이션 이전

- MVP `supabase/` 디렉토리(`config.toml`, `migrations/*`)를 repo 루트로 복사한다. 파일 이름과 타임스탬프는 바꾸지 않는다. 원격 DB의 적용 이력과 일치해야 하기 때문이다.
- 이후 신규 마이그레이션은 recipe-web에서만 만든다. MVP 저장소에는 추가하지 않는다.
- 첫 신규 마이그레이션(`bookmark.raw_text`)은 [03 문서](./03-bookmark-api.md)에서 정의한다.

## 6. 결정사항

| 결정 | 고려한 대안 | 선택 이유 |
| --- | --- | --- |
| 서버 코드를 `apps/web/src/server/`에 둔다 | 새 워크스페이스 패키지 `packages/server` | 사용처가 `apps/web` 하나뿐이다. 패키지로 나누면 `package.json`·`transpilePackages`·tsconfig 설정이 늘어나지만 얻는 경계는 `server-only`로도 충분하다. |
| MVP와 같은 Supabase 프로젝트를 쓴다 | 새 프로젝트 | 기존 사용자·북마크·별칭 캐시를 그대로 쓰고, 카카오 OAuth 재설정이 필요 없다. |
| 마이그레이션은 **추가 전용**만 허용한다 | 자유롭게 변경 | 같은 DB를 MVP 배포가 계속 쓴다. 컬럼 삭제·이름 변경·NOT NULL 추가는 MVP를 깨뜨린다. nullable 컬럼, 새 테이블, 새 인덱스만 허용한다. |
| `NEXT_PUBLIC_API_BASE_URL` 삭제 | env로 분기 유지 | 서버가 같은 앱 안에 있으므로 외부 주소가 필요 없다. 쓰이지 않는 설정은 혼란만 준다. |

## 7. 예외·오류 처리

- secret 키가 없을 때 admin 클라이언트를 생성하면 명확한 서버 오류를 던진다. 응답 본문에는 키 이름을 노출하지 않는다.
- `proxy.ts`에서 Supabase 호출이 실패해도 요청은 통과시킨다. 이 경우 세션 갱신만 건너뛴다.

## 8. 영향 범위

- [AGENTS.md](../../AGENTS.md): `apps/web/src/` 폴더 목록에 `server/`, `proxy.ts`를, repo 구조에 `supabase/`를 추가한다.
- [code-convention.md](../code-convention.md): `server/` 사용 규칙(`server-only`, 화면 코드에서 import 금지)을 추가한다.
- [api-common-policy.md](./api-common-policy.md): `NEXT_PUBLIC_API_BASE_URL` 서술을 "`/api` 고정, 같은 앱의 Route Handler"로 바꾼다.
- [frontend-backend-contract.md](./frontend-backend-contract.md): "백엔드가 맡는다"는 서술을 "같은 앱의 Route Handler가 맡는다"로 바꾼다.
- `apps/web/package.json`: `server-only` 의존성을 추가한다.

## 9. 테스트 / 완료 기준

- `pnpm lint`, `pnpm --filter web exec tsc --noEmit`, `pnpm build` 통과
- 클라이언트 컴포넌트에서 `@/server/*`를 import하면 빌드가 실패하는지 확인한다.
- 로그인 후 액세스 토큰 만료 시간이 지나도 Route Handler에서 사용자를 식별하는지 수동으로 확인한다.
- `supabase/migrations` 파일이 MVP와 바이트 단위로 같은지 확인한다(`diff`).

## 10. 미결 사항

- Vercel 배포 프로젝트: recipe-web을 새 Vercel 프로젝트로 만들지 정해야 한다. 정해지면 카카오 OAuth Redirect URL과 Supabase Site URL에 새 도메인을 추가한다.
- MVP의 `team_members` 마이그레이션은 recipe-web에서 쓰지 않는다. 그래도 이력 일치를 위해 파일은 함께 옮긴다.
