# 04. 팬트리 API 설계

- 작성자: 김도혁
- 날짜: 2026-10-02

## 1. 개요

가진 재료(최대 5개)를 받아 만들 수 있는 메뉴와, 추가로 사야 하는 재료의 금액을 돌려주는 `POST /api/pantry`를 이식한다.

- 선행 문서: [01 서버 기반](./01-server-foundation.md), [02 분석 API](./02-analyze-api.md)(가격 파이프라인 공유)
- 후속 문서: [08 팬트리 화면](./08-pantry-screen.md)

## 2. 목표 / 비목표

### 목표

- MVP `lib/pantry/recommend.ts`와 `/api/pantry` 라우트를 이식한다.
- 요청·응답 Zod 스키마와 `searchPantry` 클라이언트 함수를 추가한다.
- "추천 없음"과 "실패"를 응답에서 구분한다.

### 비목표

- 추천 메뉴를 결과 화면(`/result`)으로 연결하기. LLM 추천 메뉴에는 레시피 원문이 없다.
- 프롬프트 개선, 메뉴 개수 조정

## 3. 배경 / 현재 상태

- recipe-web `/pantry`는 제목만 있는 빈 페이지다.
- MVP 원본: `src/app/api/pantry/route.ts`, `src/lib/pantry/recommend.ts`, `src/types/pantry.ts`
- MVP 동작:
  - LLM(Gemini)은 메뉴 4개와 메뉴별 사용 재료(`uses`), 추가 재료(`extras`)만 추론한다. 금액 필드는 스키마에 아예 두지 않는다.
  - 추가 재료 금액은 PoC 가격 파이프라인의 **최소 구매 단위(pack) 가격**이다.
  - `uses`는 입력의 부분집합만 인정한다(환각 방지).
  - 결과는 `extraCost` 오름차순이고, 같으면 `unpricedCount`가 적은 순이다.
  - 같은 재료 조합은 인스턴스 메모리에 캐시한다(최대 50).
- MVP의 문제:
  - 메뉴 0개와 LLM 실패가 모두 `{ status: "error", message }` 502로 내려온다.
  - 화면은 이 둘을 모두 "결과 없음"으로 삼켰다.

## 4. 요구사항

1. 재료는 1~5개, 각 10자 이하다. 공백은 제거하고 중복도 제거한다.
2. 금액은 LLM이 아니라 가격 파이프라인에서만 나온다.
3. 가격을 찾지 못한 추가 재료는 0원으로 숨기지 않는다. `hasPrice: false`로 표시하고 `unpricedCount`에 센다.
4. 화면이 "추천 없음"(재료를 바꾸면 해결)과 "실패"(다시 시도)를 구분할 수 있어야 한다.

## 5. 상세 설계

### 5.1 계약

```ts
// 요청
{ ingredients: string[] }  // 1~5개, 각 10자 이하

// 응답
type PantryResponse =
  | { status: "success"; menus: PantryMenu[] }
  | { status: "error"; reason: "invalid_input" | "no_menu" | "failed"; message: string };

type PantryMenu = {
  name: string;
  description: string;
  usedIngredients: string[];                 // 입력의 부분집합
  extraIngredients: PantryExtraIngredient[];
  extraCost: number;                         // 가격이 붙은 추가 재료의 packCost 합
  unpricedCount: number;                     // 0이 아니면 extraCost는 하한값
};

type PantryExtraIngredient = {
  name: string;
  canonical: string | null;
  packCost: number | null;
  packLabel: string | null;                  // "500g 팩 9,250원"
  priceConfidence: "actual" | "estimate" | null;
  hasPrice: boolean;
};
```

| reason | HTTP | 원인 |
| --- | --- | --- |
| `invalid_input` | 400 | 개수·길이 위반, 본문 파싱 실패 |
| `no_menu` | 200 | LLM이 유효한 메뉴를 하나도 주지 않음 |
| `failed` | 502 | LLM 호출 실패, 할당량 초과, 그 밖의 예외 |

### 5.2 파일 배치

```
packages/api/src/schemas/pantry.ts
packages/api/src/client/pantry.ts            # searchPantry(client, ingredients)
apps/web/src/server/pantry/recommend.ts      # MVP recommend.ts 이식
apps/web/src/app/api/pantry/route.ts
```

### 5.3 실행 설정

- `runtime = "nodejs"`, `maxDuration = 60`
- 클라이언트 요청 `timeout: 60_000`. LLM 재시도(최대 2회)까지 고려한 값이다.

## 6. 결정사항

| 결정 | 고려한 대안 | 선택 이유 |
| --- | --- | --- |
| `reason`을 추가해 `no_menu`와 `failed`를 나눈다 | MVP처럼 `message`만 | "재료 다시 고르기"와 "다시 시도"는 사용자가 할 행동이 다르다. 문구 비교로 분기하면 깨지기 쉽다. |
| `no_menu`는 200으로 준다 | MVP처럼 502 | 서버 장애가 아니라 정상적인 빈 결과다. 공통 재시도와 오류 알림 정책(5xx 재시도)에 걸리지 않아야 한다. |
| 메모리 캐시를 유지한다 | 제거하거나 DB 캐시 | MVP에서 검증됐고, 같은 조합의 반복 요청에서 LLM 쿼터를 아낀다. 서버리스라 인스턴스마다 비어 있을 수 있음을 감수한다. |
| 프롬프트와 메뉴 수(4개)는 그대로 둔다 | 조정 | 이식 범위를 넘는다. 바꾸려면 별도 작업으로 한다. |

## 7. 예외·오류 처리

- `GEMINI_API_KEY`가 없으면 `failed`를 준다. 메뉴를 지어내지 않는다.
- 일부 추가 재료의 가격 조회가 실패하면 해당 재료만 `hasPrice: false`로 두고 나머지는 계속 계산한다.
- 응답 메시지는 한국어 안내 문구만 쓴다. 원본 오류는 서버 로그에만 남긴다.

## 8. 영향 범위

- [frontend-backend-contract.md](./frontend-backend-contract.md): pantry 엔드포인트 추가
- `packages/api/src/index.ts`: export 추가

## 9. 테스트 / 완료 기준

- 스키마·클라이언트 테스트(MSW): success, `invalid_input`, `no_menu`, `failed`, 타임아웃 옵션 전달
- recommend 단위 테스트(LLM 모킹):
  - 입력에 없는 `uses` 제거
  - `extraCost` 정렬
  - `unpricedCount` 집계
- 수동: `["돼지고기","신김치","두부"]` 요청으로 메뉴 4개와 금액이 나오는지 확인
- `pnpm lint`, 테스트, `tsc --noEmit` 통과

## 10. 미결 사항

- 메모리 캐시 때문에 같은 조합은 시세가 바뀌어도 인스턴스가 살아 있는 동안 같은 금액을 준다. 캐시 유효 시간(예: 당일)을 둘지 정해야 한다.
