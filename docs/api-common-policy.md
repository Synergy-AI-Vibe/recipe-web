# API 공통 계층과 오류 정책

## 현재 구현 범위

1~4단계는 오류 모델·정규화 함수, Axios 클라이언트·interceptor,
웹 앱의 환경변수 연결과 TanStack Query Provider·캐시·재시도 설정,
라우트 오류·로딩·404 화면 및 공통 오류 알림을 제공한다.
응답 검증 유틸리티와 개별 Zod 스키마는 실제 API 연동 시 필요에 따라 추가한다.
클라이언트 옵션 타입은 생성 함수와 같은 파일에 정의한다.
실제 도메인 API·카카오 인증 연동은 후속 단계에서 구현한다.

## 계층별 책임

| 계층 | 책임 |
| --- | --- |
| `packages/api` | Axios 통신, 오류 정규화; 도메인 API 함수·응답 스키마는 연동 시 추가 |
| 웹 앱의 Query 계층 | query key, 캐시, 취소 신호 전달, 재시도, 무효화 |
| 웹 앱의 인증 계층 | 인증 정보 주입, 401 후속 처리, 세션 변경 시 캐시 정리 |
| 웹 앱의 화면·라우트 | 사용자 안내, 로딩·빈 상태, 오류 경계, `notFound()` 판단 |

API 패키지는 React·Next.js·Zustand를 import하지 않는다. 환경변수도 직접 읽지 않는다.
서버 응답은 Query 캐시에서 관리하며 Zustand에 중복 저장하지 않는다.

## 공개 인터페이스

모든 공개 타입과 함수는 `@recipe-web/api`에서 가져온다.

- `ApiError`: `kind`, 선택적인 HTTP `status`와 업무 `code`, 안전한 `message`를 가진 Error.
- `ApiErrorKind`: `http | network | timeout | validation | unknown`.
- `ApiRequestCanceledError`: 일반 실패와 구분하는 `kind: "canceled"` 취소 타입.
- `NormalizedApiError`: `ApiError | ApiRequestCanceledError`.
- `normalizeApiError(error: unknown): NormalizedApiError`: 네트워크 호출 또는 **서버 응답 검증**에서 잡은 오류를 정규화한다.
- `isApiRequestCanceled(error: unknown): boolean`: 정규화 전후의 취소를 판별한다.
- `createApiClient(options: ApiClientOptions): AxiosInstance`: 설정과 interceptor가 적용된 독립적인 클라이언트를 생성한다.

정규화 함수는 입력을 throw하지 않고 Error 객체를 반환한다. 호출부는 이를 reject/throw해야 하며,
취소도 성공 값으로 바꾸지 않는다. 이미 정규화한 오류는 동일한 인스턴스를 반환한다.

```ts
import { isApiRequestCanceled, normalizeApiError } from "@recipe-web/api";

// 통신 계층: catch에서 throw normalizeApiError(error)
// 표시·재시도 계층: 아래 분기로 취소를 먼저 제외한다.
const shouldNotify = (error: unknown) => !isApiRequestCanceled(error);
```

## Axios 설정과 사용

| 옵션 | 기본값·동작 |
| --- | --- |
| `baseURL` | 필수. 전달받은 API 주소를 Axios에 그대로 설정 |
| `timeout` | 10,000ms; 요청별 변경 가능 |
| `withCredentials` | false; 쿠키 인증 계약 연결 시 명시적으로 활성화 |

공통 팩터리는 URL 형식을 별도로 검증하지 않는다.
전역 Axios 인스턴스는 수정하지 않으며, 각 클라이언트 생성 시 interceptor를 한 번만 등록한다.
요청별 헤더·params·본문·`AbortSignal`은 Axios 기본 설정으로 전달한다.
Content-Type을 일괄 고정하지 않아 JSON·FormData 등은 Axios가 처리한다.

성공 시 `AxiosResponse`를 그대로 반환한다. 응답 envelope나 `data.data`를 가정하지 않는다.
실패 시 정규화된 오류를 reject하며 취소도 성공으로 바꾸지 않는다.
401도 다른 HTTP 오류와 동일하게 정규화한다. 인증 헤더 주입과 401 후속 처리는 인증 연동 단계에서 추가한다.
재시도·재발급·화면 이동·알림은 실행하지 않는다.

웹 앱은 `@/lib/api-client`의 `getApiClient()`로 클라이언트를 가져온다.
이 함수는 `process.env.NEXT_PUBLIC_API_BASE_URL`을 직접 참조해 Next.js의 빌드 시점 주입을 지원한다.
미설정·빈 값은 생성 전에 거부한다.
브라우저에서는 인스턴스를 재사용하고 서버에서 호출할 때는 매번 새로 생성한다.
이는 서버 전역 인스턴스 공유를 막기 위한 것으로, 인증 SSR·쿠키 전달 기능을 제공하는 것은 아니다.

환경변수는 `apps/web/.env.example`을 참고해 `.env.local`에 설정한다.
값은 공개되는 API 주소이며 비밀 키를 포함하지 않는다. 배포 주소 변경 시 다시 빌드한다.
생성은 최초 호출까지 지연되므로 API를 사용하지 않는 초기 페이지는 주소 미설정 상태에서도 동작한다.
브라우저 쿠키 전송의 실제 성공 여부는 추후 백엔드 CORS·쿠키 정책과 함께 검증한다.

## TanStack Query 설정과 사용

`apps/web/src/components/providers.tsx`가 `QueryClientProvider`를 제공하며 루트 layout의 children을 감싼다.
layout은 Server Component로 유지한다. Devtools는 개발 환경에서만 표시한다.
`@/lib/query-client`의 `getQueryClient()`는 브라우저에서 같은 인스턴스를 재사용하고,
서버에서는 호출마다 새 인스턴스를 반환해 요청 간 캐시 공유를 방지한다.

| 설정 | 기본 동작 |
| --- | --- |
| `staleTime` | 1분. 이 기간에는 같은 키의 캐시를 재사용 |
| `gcTime` | 브라우저에서 사용하지 않는 캐시를 5분 후 제거; 서버는 타이머 없이 인스턴스 수명에 따름 |
| `refetchOnWindowFocus` | false |
| `refetchOnReconnect` | true. 연결 복구 시 관찰 중인 오래된 조회를 갱신 |
| query `retry` | 정규화된 네트워크·타임아웃·5xx 오류만 1회 재시도; 최초 요청 포함 최대 2회 |
| mutation `retry` | false |

재시도 간격은 TanStack Query 기본값을 사용한다. 4xx·취소·검증·알 수 없는 오류는 재시도하지 않는다.
각 API 함수는 성공 시 응답 데이터를 반환하고 실패 시 오류를 그대로 throw한다.
조회 함수의 `signal`을 Axios 요청에 전달해야 Query 취소 시 HTTP 요청도 중단된다.
서버 데이터는 Query 캐시에서 관리하고 Zustand에 복사하지 않는다.

아래는 실제 API 연동 시 사용할 작성 예시다. 엔드포인트와 타입은 실제 명세에 맞춘다.
현재 앱에는 도메인별 query key·hook·API 함수나 가짜 요청을 추가하지 않았다.

```tsx
// Client Component에서 사용하는 도메인별 Query 정의 예시
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@/lib/api-client";

type Recipe = { id: number; title: string };

const recipeKeys = {
  all: ["recipes"] as const,
  detail: (id: number) => ["recipes", "detail", id] as const,
};

const recipeQueryOptions = (id: number) => queryOptions({
  queryKey: recipeKeys.detail(id),
  queryFn: async ({ signal }) => {
    const response = await getApiClient().get<Recipe>(`/recipes/${id}`, { signal });
    return response.data;
  },
});

const useRecipe = (id: number) => useQuery(recipeQueryOptions(id));

const useCreateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { title: string }) => {
      const response = await getApiClient().post<Recipe>("/recipes", input);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: recipeKeys.all }),
  });
};
```

조회 결과에 영향을 주는 ID·검색어·페이지 등은 query key에 포함한다.
mutation 성공 후 관련 키를 무효화하면 관찰 중인 조회는 다시 요청하고,
사용하지 않는 조회는 다음 사용 시 갱신한다. `onSuccess`에서 무효화 Promise를 반환하면 갱신까지 기다린다.
위 TypeScript 타입은 실제 응답을 검증하지 않는다. Zod 검증은 필요할 때 별도로 추가한다.
SSR prefetch·hydration은 현재 설정에 포함하지 않는다.

## 오류 분류 및 정보 노출

| 입력 | 정규화 결과 |
| --- | --- |
| Axios 취소·`ERR_CANCELED`·Error의 `AbortError` | `ApiRequestCanceledError` |
| Zod 서버 응답 검증 실패 | `validation` |
| Axios HTTP 응답이 있는 실패 | `http`, 응답의 HTTP 상태 보존 |
| 응답 없는 `ECONNABORTED`·`ETIMEDOUT` | `timeout` |
| `ERR_NETWORK` 또는 응답 없이 요청 객체가 있는 실패 | `network` |
| 요청 전 설정 오류·기타 입력 | `unknown` |

취소 판별 이후에는 HTTP 응답을 타임아웃·네트워크 코드보다 우선한다.
ZodError를 `validation`으로 분류하는 기존 정규화 기능은 유지한다.
현재 성공 응답을 Zod로 검증하는 호출부는 없으며, 모든 응답에 검증을 강제하지 않는다.
Zod 폼 입력 검증은 폼 계층에서 처리하며 이 함수로 전달하지 않는다.

사용자 메시지는 코드에서 정의한 한국어 문구만 사용한다. 원본 메시지, 응답 본문,
요청 URL·본문·헤더, Zod issues, 원본 cause를 정규화한 객체에 보관하지 않는다.
서버 응답 envelope를 가정하거나 `response.data.code/message`를 자동 추출하지 않는다.
업무 `code`는 후속 명세 연동 계층에서 검증한 값만 `ApiError` 생성 시 명시적으로 전달한다.
업무 코드는 UI에 그대로 표시하지 않는다. 원본 Axios 오류를 직접 로깅하지 않는다.

## 오류 처리 정책과 화면 연결

| 상황 | 처리 주체·정책 |
| --- | --- |
| 요청 취소 | 알림·재시도·오류 경계에서 제외 |
| 네트워크·타임아웃·5xx | 3단계 적용: 조회만 1회 재시도; mutation 자동 재시도 없음 |
| 4xx·응답 검증·알 수 없는 오류 | 3단계 적용: 자동 재시도 없음 |
| 401 | 인증 연동 단계에서 후속 처리 추가; 현재는 정규화된 오류 전달 |
| 403 | 화면에서 권한 부족 안내 |
| API 404 | 호출 화면이 의미 판단; 필수 페이지 리소스 부재일 때만 `notFound()` |
| 최초 조회 실패 | 해당 영역에서 오류·재시도 표시 |
| 백그라운드 갱신 실패 | 기존 데이터 유지·공통 알림 |
| 입력·업무 오류 | 폼 또는 해당 기능에서 표시 |
| mutation 오류 | 기본적으로 공통 알림; `meta.errorMode: "local"`이면 생략 |
| 예상하지 못한 렌더링 오류 | 가까운 오류 경계에서 복구 UI |

interceptor는 응답 오류 정규화를 담당한다. 화면 이동·알림·일반 재시도는 실행하지 않는다.
Query의 `meta.errorMode`는 `local | notify | boundary`다. 최초 조회 실패는 기본적으로
호출 화면의 `isError` 상태에서 표시한다(`local`). `notify`를 선택하면 공통 알림을 띄운다.
`boundary`를 선택한 조회는 데이터가 없는 실패만 가까운 `error.tsx`로 전달한다.
기존 데이터의 갱신 실패는 모든 모드에서 데이터를 유지하고 공통 알림을 한 번 띄운다.
요청 취소는 알림과 오류 경계에서 제외한다.

mutation 오류는 호출부에서 처리하는지와 관계없이 기본적으로 공통 알림을 띄운다.
폼에서 오류를 직접 표시할 때는 `meta: { errorMode: "local" }`을 지정해 알림을 생략한다.
mutation 오류를 경계로 보내려면 같은 `local` 설정으로 공통 알림을 끄고 해당 hook에서
`throwOnError`를 명시적으로 설정한다.
`mutateAsync` 호출부에서는 반환된 Promise의 실패도 처리해야 한다.

공통 알림은 브라우저에서 가장 최근 오류 한 건을 표시하고 5초 후 닫는다.
`ApiError`의 안전한 메시지만 사용하며 기타 오류에는 고정 문구를 표시한다.
루트 `app/error.tsx`는 처리되지 않은 렌더링 오류에 복구 버튼을 제공한다.
버튼은 Query 오류 경계의 재시도 제한을 해제한 뒤 라우트를 다시 렌더링한다.
`app/not-found.tsx`는 알 수 없는 경로 및 호출부에서 `notFound()`를 선택한 경우에 표시된다.
`app/loading.tsx`는 라우트 구간의 Suspense 로딩 UI다. 클라이언트 Query의 로딩 상태는
실제 도메인 화면에서 별도로 표시한다. 현재 루트 layout 자체의 오류를 처리하는
`global-error.tsx`는 추가하지 않았다.

```tsx
const recipe = useQuery({
  ...recipeQueryOptions(id),
  meta: { errorMode: "boundary" }, // 필수 리소스의 최초 실패를 라우트 경계로
});

const save = useMutation({
  mutationFn: saveRecipe,
  meta: { errorMode: "local" }, // 폼 오류 메시지로 직접 표시
});
```

API 404를 곧바로 `notFound()`로 바꾸지 않는다. 필수 페이지 리소스 부재라고 판단한
라우트에서만 사용한다. 현재 앱에는 해당 판단을 할 실제 도메인 호출이 없다.

## 검증

```bash
pnpm --filter @recipe-web/api test
pnpm --filter @recipe-web/api typecheck
pnpm --filter web test
pnpm --filter web exec next typegen
pnpm --filter web exec tsc --noEmit
pnpm lint
```

테스트는 실제 네트워크·인증 서버 없이 HTTP 상태별 메시지, 통신 실패 분류,
Zod 검증 실패, 취소, 알 수 없는 입력, 민감 정보 미보관, 재정규화 시 동일성을 검증한다.
Axios 통합 테스트는 MSW의 Node 인터셉터로 HTTP 요청을 모의 처리한다.
요청 설정 전달, HTTP 오류 정규화, 타임아웃, 전송 전·후 취소,
자동 재시도 없음과 성공 응답 구조 유지를 확인한다. 미등록 요청은 테스트 실패로 처리한다.
MSW는 개발 의존성이며 앱에 모의 API나 Service Worker를 추가하지 않는다.
브라우저 worker 복사용 postinstall은 `pnpm-workspace.yaml`에서 비활성화한다.

구현 참고: [Axios interceptor](https://axios-http.com/docs/interceptors),
[MSW Node 통합](https://mswjs.io/docs/integrations/node/),
[Zod 기본 사용법](https://zod.dev/basics).

웹 앱의 Query 테스트는 캐시 수명·동시 요청 중복 방지·서버 인스턴스 분리·브라우저 재사용,
오류별 재시도 횟수·mutation 무효화·Query에서 Axios로 이어지는 요청 취소,
최초 조회와 백그라운드 갱신·mutation 알림 정책을 검증한다.
테스트에만 재시도 대기 시간 0과 모의 API를 사용한다.

Query 구현 참고: [App Router Provider 구성](https://tanstack.com/query/v5/docs/framework/react/guides/advanced-ssr),
[재시도](https://tanstack.com/query/v5/docs/framework/react/guides/query-retries),
[요청 취소](https://tanstack.com/query/v5/docs/framework/react/guides/query-cancellation),
[Devtools](https://tanstack.com/query/v5/docs/framework/react/devtools).
