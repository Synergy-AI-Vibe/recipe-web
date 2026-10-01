# 02. 분석 API와 계산식 설계

- 작성자: 김도혁
- 날짜: 2026-10-02

## 1. 개요

유튜브 주소나 직접 입력한 레시피를 받아 재료·가격·매장가를 계산하는 `POST /api/analyze`를 recipe-web에 이식한다.
결과 화면이 쓸 계산식(`calc.ts`)과 전체 응답 Zod 스키마도 함께 정한다.

- 선행 문서: [01 서버 기반](./01-server-foundation.md)
- 후속 문서: [06 결과 화면](./06-result-screen.md)

## 2. 목표 / 비목표

### 목표

- MVP PoC 파이프라인(`lib/recipe/**`)과 어댑터(`recipe-adapter.ts`)를 `apps/web/src/server/`로 옮긴다.
- `POST /api/analyze` Route Handler를 구현한다.
- `analyzeResponseSchema`를 `AnalyzeData` 전체로 확장해 FE와 BE의 공통 계약으로 삼는다.
- 계산식 `calc.ts`를 한 곳에 두고 서버 어댑터와 결과 화면이 함께 쓴다.

### 비목표

- 파이프라인 알고리즘 개선(재료 파싱, 가격 매칭, 프롬프트).
- 조리 단계(`steps`) 추출. PoC가 추출하지 않으므로 빈 배열로 둔다.
- 분석 결과 캐싱이나 저장.

## 3. 배경 / 현재 상태

- recipe-web 홈은 `analyzeRecipe()`로 `/api/analyze`를 호출한다. 현재 스키마는 `recipe.title`과 `ingredients: unknown[]`만 검증한다 ([schemas/analyze.ts](../../packages/api/src/schemas/analyze.ts)).
- MVP 원본:
  - `src/app/api/analyze/route.ts`
  - `src/lib/recipe/**`(JS ESM, fetch → parse → price → llm)
  - `src/lib/recipe-adapter.ts`
  - `src/lib/calc.ts`
  - `src/lib/data/store-price.ts`, `src/lib/data/unmatched.ts`
  - `src/types/api.ts`
- MVP 실측: 재료 추출 성공률 60%. 설명란과 고정 댓글 모두에서 재료를 못 찾는 비율은 35%로, 오류가 아니라 정상 경로다. 홀드아웃 재현율 95%, 정밀도 91%.

MVP와 달라지는 점:

- 계약 정본이 `src/types/api.ts`(TS 타입)에서 `@recipe-web/api`의 Zod 스키마로 바뀐다.
- MVP의 목 분기(`USE_MOCK`, `?mock=notfound|nostore`)는 옮기지 않는다.
- `env.js`의 `.env` 직접 로드는 제거한다. Next.js가 주입한 `process.env`만 쓴다.

## 4. 요구사항

### 요청

```ts
{ url: string } | { text: string }
```

- `url`은 유튜브 주소 형식만 허용한다. 화면에서 먼저 거르지만 서버도 한 번 더 검증한다.

### 응답 (`status`로 분기)

| status | 의미 | 화면 처리 |
| --- | --- | --- |
| `success` | 계산 완료 | 결과 화면 |
| `no_recipe_found` | 재료를 찾지 못함 (정상 경로) | 홈 추출 실패 카드 |
| `error` | `INVALID_URL` / `FETCH_FAILED` / `RATE_LIMITED` / `INTERNAL` | 홈 계산 실패 카드 |

### 금액 규칙

- 원 단위 정수로 표기하고, 날짜는 `YYYY-MM-DD`로 쓴다.
- 서버는 초기 1회만 계산한다. 이후 재료 조정은 화면에서 `calc.ts`로 다시 계산한다.

## 5. 상세 설계

### 5.1 파일 배치

```
packages/api/src/schemas/analyze.ts      # 요청·응답 Zod 스키마 (계약 정본)
apps/web/src/lib/calc.ts                 # 계산식 (서버·화면 공용, 순수 함수)
apps/web/src/server/recipe/**            # PoC 파이프라인 (JS + .d.ts, 원본 그대로)
apps/web/src/server/adapters/analyze.ts  # PoC 출력 → AnalyzeResponse
apps/web/src/server/data/store-price.ts  # 매장가 DB 폴백
apps/web/src/server/data/unmatched.ts    # 매칭 실패 수집
apps/web/src/app/api/analyze/route.ts    # 입력 검증 + 어댑터 호출
```

### 5.2 응답 스키마 (요약)

MVP `types/api.ts`를 Zod로 옮긴다. 필드 의미는 MVP 주석을 스키마 JSDoc으로 함께 옮긴다.

```ts
AnalyzeData = {
  recipe: { title, servings, sourceType: "youtube" | "manual", sourceUrl, thumbnailUrl, channelName, steps: string[], rawText }
  ingredients: IngredientRow[]   // id, rawText, name, role, qty, unit, amount, amountUnit, conversionNote,
                                 // needsConfirm, unitCost, packCost, packLabel, priceTier, priceConfidence,
                                 // hasPrice, checked, userPrice
  store: StorePrice | null       // menuName, min, max, avg(배달비 포함), deliveryFee, sampleSize, surveyedOn
  totals: Totals                 // 초기 렌더용. 화면은 calc로 다시 구한다
  warnings: Warnings
  priceBaseDate: string
  normalize: NormalizeStats | null
}
```

- 서버 어댑터는 `z.infer` 타입으로 응답 객체를 만든다. 계약이 바뀌면 서버와 화면이 함께 컴파일 오류를 낸다.
- 클라이언트는 `analyzeResponseSchema.parse()`로 검증한다. 알 수 없는 필드는 Zod 기본 동작대로 제거(strip)한다.

### 5.3 계산식 (`calc.ts`)

MVP `calc.ts`를 수정 없이 옮긴다.

```
재료비 합계 = Σ(체크된 재료: hasPrice ? unitCost : userPrice)
장바구니    = Σ(체크된 재료: hasPrice ? packCost : userPrice)
절약        = max(store.avg − 재료비 합계, 0)
퍼센트      = 절약 ÷ store.avg × 100 (소수 1자리)
막대 채움   = min(재료비 합계 ÷ store.avg × 100, 100)
1인분       = round(재료비 합계 ÷ servings)
```

- 공개 함수: `computeTotals`, `computeWarnings`, `formatWon`, `formatPercent`, `rowIngredientCost`, `rowBasketCost`
- React·Supabase·`server-only`를 import하지 않는다. 서버와 클라이언트 양쪽에서 import된다.

### 5.4 Route Handler

- `export const runtime = "nodejs"`: 파이프라인이 `node:https`를 쓴다.
- `export const maxDuration = 60`: 유튜브와 LLM 호출이 겹치면 10초를 넘는다.
- 처리 순서: 본문 파싱 → `url`/`text` 검증 → 파이프라인 → 어댑터 → JSON 응답.

### 5.5 클라이언트 호출

- `analyzeRecipe()`에 요청별 `timeout: 60_000`을 준다. 공통 기본값은 10초다.
- 홈: 기존 `useAnalyzeRecipe` mutation(재시도 없음)을 그대로 쓴다.
- 결과 화면 딥링크: `useQuery`에 `retry: false`를 준다. 자세한 내용은 [06 문서](./06-result-screen.md)에 있다.

## 6. 결정사항

| 결정 | 고려한 대안 | 선택 이유 |
| --- | --- | --- |
| 파이프라인은 JS 그대로 이식하고 lint 대상에서 제외한다 | TS로 변환하거나 리팩터링 | 실데이터 60건으로 검증된 로직이다(MVP 규칙 1-1). 변환 중 동작이 바뀌면 다시 검증할 방법이 없다. 별칭 매칭에 앵커(`^`)를 쓰지 않는 규칙(1-2)도 그대로 지킨다. |
| 계약 정본은 `@recipe-web/api` Zod 스키마 | TS 타입 파일을 별도로 유지 | 런타임 검증과 타입을 한 곳에서 얻는다. 서버도 같은 타입을 써서 어긋날 수 없다. |
| `calc.ts`는 `apps/web/src/lib/`에 둔다 | `packages/api`에 둔다 | 계산식은 API 통신이 아니라 도메인 로직이다. 사용처(서버 어댑터, 결과 화면)가 모두 `apps/web` 안에 있다. |
| 목 분기를 옮기지 않는다 | `?mock=` 유지 | 운영 코드에 테스트 분기가 남는다. 테스트는 MSW로 응답을 흉내 낸다. |
| 요청 타임아웃 60초, 자동 재시도 없음 | 기본 10초, 1회 재시도 | 실제 처리 시간이 10초를 넘는다. 재시도하면 비용이 큰 LLM과 유튜브 API 호출이 두 배가 된다. |

## 7. 예외·오류 처리

| 상황 | HTTP | 응답 |
| --- | --- | --- |
| 본문 파싱 실패 | 400 | `error` / `INTERNAL` |
| `url`·`text` 모두 없음, 유튜브 형식 아님 | 400 | `error` / `INVALID_URL` |
| 영상 비공개·삭제 | 200 | `error` / `FETCH_FAILED` |
| 유튜브 API 할당량 초과 | 200 | `error` / `RATE_LIMITED` |
| 재료 0개 | 200 | `no_recipe_found` |
| 예상하지 못한 예외 | 500 | `error` / `INTERNAL`. 원본 메시지는 서버 로그에만 남긴다 |

- `GEMINI_API_KEY`가 없으면 LLM 단계를 건너뛰고 규칙 매칭만 쓴다. 매장가는 DB 폴백을 쓴다(MVP 동작).
- 클라이언트 응답 검증에 실패하면 `validation` 오류로 정규화하고 홈 계산 실패 카드를 보여준다.

## 8. 영향 범위

- [packages/api/src/schemas/analyze.ts](../../packages/api/src/schemas/analyze.ts): success 분기 확장
- [packages/api/src/client/analyze-recipe.ts](../../packages/api/src/client/analyze-recipe.ts): 요청별 타임아웃
- [frontend-backend-contract.md](./frontend-backend-contract.md): analyze 응답 형태를 MVP 실제 계약으로 정정
- `apps/web/eslint.config`: `src/server/recipe/**` 제외

## 9. 테스트 / 완료 기준

- `calc.test.ts`:
  - 체크 해제, 직접 입력 금액, 매장가 없음, 인분 0, 절약 음수 → 0
  - PoC 사례(삼겹살 누락 8,522원 vs 26,198원) 재현
- `analyze-recipe.test.ts`: success·no_recipe_found·error 응답 파싱, 타임아웃 옵션 전달(MSW)
- 어댑터 테스트: 파싱 잔여물이 `seasoning`으로 분류되는지, 썸네일 URL이 맞게 생성되는지
- 수동: 실제 유튜브 링크 3개(성공·재료 없음·비공개)와 직접 입력 1건
- `pnpm lint`, `pnpm --filter web test`, `pnpm --filter @recipe-web/api test`, `tsc --noEmit` 통과

## 10. 미결 사항

- `normalize` 통계(규칙/캐시/LLM/실패 개수)를 화면에 노출할지 정하지 않았다. 현재는 받기만 한다.
- `steps`가 항상 빈 배열이므로, 06 문서의 조리법 탭은 원문(`rawText`) 중심으로 구성한다.
