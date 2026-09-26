# API 공통 계층과 오류 정책

## 현재 구현 범위

1단계는 오류 모델·정규화 함수를 제공한다.
`createApiClient` 런타임 함수, interceptor, Query Provider, 오류 화면,
실제 API·카카오 인증 연동은 아직 구현하지 않았다.
클라이언트 옵션 타입은 2단계에서 생성 함수와 같은 파일에 정의한다.
별도의 함수 타입이나 타입 파일은 미리 추가하지 않는다.

## 계층별 책임

| 계층 | 책임 |
| --- | --- |
| `packages/api` | Axios 통신, API 함수, 응답 스키마 검증, 오류 정규화 |
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

정규화 함수는 입력을 throw하지 않고 Error 객체를 반환한다. 호출부는 이를 reject/throw해야 하며,
취소도 성공 값으로 바꾸지 않는다. 이미 정규화한 오류는 동일한 인스턴스를 반환한다.

```ts
import { isApiRequestCanceled, normalizeApiError } from "@recipe-web/api";

// 통신 계층: catch에서 throw normalizeApiError(error)
// 표시·재시도 계층: 아래 분기로 취소를 먼저 제외한다.
const shouldNotify = (error: unknown) => !isApiRequestCanceled(error);
```

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
Zod 폼 입력 검증은 폼 계층에서 처리하며 이 함수로 전달하지 않는다.

사용자 메시지는 코드에서 정의한 한국어 문구만 사용한다. 원본 메시지, 응답 본문,
요청 URL·본문·헤더, Zod issues, 원본 cause를 정규화한 객체에 보관하지 않는다.
서버 응답 envelope를 가정하거나 `response.data.code/message`를 자동 추출하지 않는다.
업무 `code`는 후속 명세 연동 계층에서 검증한 값만 `ApiError` 생성 시 명시적으로 전달한다.
업무 코드는 UI에 그대로 표시하지 않는다. 원본 Axios 오류를 직접 로깅하지 않는다.

## 후속 단계에서 적용할 처리 정책

클라이언트 구현 시 필수 `baseURL`, 선택적인 `timeout`, `withCredentials`,
비동기 인증 정보 주입과 401 통지 연결부를 제공한다.
주소를 검증하고 타임아웃 10초·credentials 비활성화를 기본값으로 적용한다.
401 통지 콜백의 실패로 원래 HTTP 오류를 교체하거나 요청을 자동 재실행하지 않는다.

| 상황 | 처리 주체·정책 |
| --- | --- |
| 요청 취소 | 알림·재시도·오류 경계에서 제외 |
| 네트워크·타임아웃·5xx | 조회만 1회 재시도; mutation 자동 재시도 없음 |
| 4xx·응답 검증·알 수 없는 오류 | 자동 재시도 없음 |
| 401 | 인증 연결부로 전달; 현재 자동 이동·재발급 없음 |
| 403 | 화면에서 권한 부족 안내 |
| API 404 | 호출 화면이 의미 판단; 필수 페이지 리소스 부재일 때만 `notFound()` |
| 최초 조회 실패 | 해당 영역에서 오류·재시도 표시 |
| 백그라운드 갱신 실패 | 기존 데이터 유지·공통 알림 |
| 입력·업무 오류 | 폼 또는 해당 기능에서 표시 |
| 처리되지 않은 mutation 오류 | 공통 알림 |
| 예상하지 못한 렌더링 오류 | 가까운 오류 경계에서 복구 UI |

interceptor는 오류 정규화까지만 담당한다. 화면 이동·알림·일반 재시도는 실행하지 않는다.
Query의 `meta.errorMode`는 후속 단계에서 `local | notify | boundary`로 정의하며,
query는 local, mutation은 notify를 기본으로 한다. 백그라운드 실패는 기존 데이터를
유지하며 알리고, boundary를 선택한 조회만 오류 경계로 전달한다. 한 실패를 중복 안내하지 않는다.

## 검증

```bash
pnpm --filter @recipe-web/api test
pnpm --filter @recipe-web/api typecheck
```

테스트는 실제 네트워크·인증 서버 없이 HTTP 상태별 메시지, 통신 실패 분류,
Zod 검증 실패, 취소, 알 수 없는 입력, 민감 정보 미보관, 재정규화 시 동일성을 검증한다.
