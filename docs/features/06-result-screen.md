# 06. 결과 화면 설계

- 작성자: 김도혁
- 날짜: 2026-10-02

## 1. 개요

분석한 레시피를 "직접 만들면 얼마를 아끼는지"로 보여주는 `/result` 화면을 만든다.
사용자는 집에 있는 재료를 빼거나, 가격이 없는 재료에 금액을 넣으면서 결과를 바로 조정할 수 있다.

- 선행 문서: [02 분석 API](./02-analyze-api.md), [05 2차 공용 컴포넌트](./05-ui-components-2.md)
- 후속 문서: [07 북마크 저장·열기](./07-bookmark-save-open.md)

## 2. 목표 / 비목표

### 목표

- `/result` 라우트, 탭 3개(절약 금액, 재료별 금액, 조리법)
- 앱 컴포넌트 `IngredientRow`, `CompareBar`
- 재료 체크 해제와 직접 입력 금액에 따른 즉시 재계산(`calc.ts`)
- 홈에서 분석에 성공하면 `/result`로 이동
- 새로고침·카카오 로그인 왕복·딥링크(`?url=`) 뒤에도 결과 유지

### 비목표

- 결과 화면 상단 입력창. MVP는 결과 위에 입력창을 다시 보여줬지만, 1차에서는 "다른 레시피 넣기" 링크로 대신한다.
- 오프라인 읽기
- 북마크 버튼 동작. 버튼 배치만 하고 동작은 [07 문서](./07-bookmark-save-open.md)에서 다룬다.
- MVP 후속 변경(YOUTUBE 라벨 제거, 만족도 조사 버튼, PWA)

## 3. 배경 / 현재 상태

- recipe-web 홈은 분석에 성공하면 홈 안에 "재료 N개의 가격을 계산했습니다" 카드만 보여준다 ([analysis-outcome.tsx](../../apps/web/src/components/home/analysis-outcome.tsx)).
- MVP 원본:
  - `src/app/result/page.tsx`
  - `src/lib/current-analysis.ts`(sessionStorage 스토어)
  - `src/components/recibi/ui/{IngredientRow,CompareBar}`
- MVP 방식: 결과는 `sessionStorage`에 보관하고 `/result`로 이동한다. 재료 조정은 화면 로컬 상태라서 새로고침하면 사라진다.
- PoC는 조리 단계를 추출하지 않는다(`steps: []`). 직접 입력은 `rawText`도 `null`로 내려온다.

## 4. 사용자 시나리오 / 화면 상태

### 진입 경로

| 경로 | 데이터 출처 |
| --- | --- |
| 홈에서 분석 성공 | 홈 mutation 결과 → 스토어 → `/result` |
| 새로고침, 카카오 로그인 왕복 | sessionStorage에 persist된 스토어 |
| `/result?url=...` 딥링크, 유튜브 북마크 열기 | 스토어에 같은 출처가 없으면 다시 분석 |
| 직접 입력 북마크 열기 | [07 문서](./07-bookmark-save-open.md): 원문으로 분석한 뒤 스토어 → `/result` |

### 화면 상태

| 코드 | 상태 | 표시 |
| --- | --- | --- |
| r0 | 불러오는 중(딥링크 재분석) | Skeleton 3줄 |
| r1 | 절약 금액 탭 | 절약액(큰 숫자), 사 먹기 vs 해 먹기 문장, CompareBar, 1인분 비교, 매장가 기준 |
| r1' | 매장가 없음 | 비교 영역을 접고 재료비 합계와 1인분 금액만 표시 |
| r2 | 재료별 금액 탭 | IngredientRow 목록, 합계와 조정 안내 한 줄, 추정 가격 개수, 장바구니 금액, 가격 출처 3열 |
| r4 | 조리법 탭 | 재료 요약 한 줄, 조리 단계(없으면 안내), 원문 접기 |
| rx | 재분석 실패 | NoticeCard "다시 불러오지 못했습니다" + "홈으로" |

- 탭은 라우팅이 아니라 화면 상태다. 재진입하면 항상 "절약 금액" 탭으로 시작한다.
- 주재료 가격이 없으면 r1·r2 상단에 Banner로 경고한다(NFR-04).

## 5. 상세 설계

### 5.1 데이터 관리: 하이브리드

**요청은 TanStack Query, 결과 문서는 Zustand**가 맡는다.

```
홈 submit ─ useAnalyzeRecipe (mutation) ─ success ─▶ resultStore.open(source, data) ─▶ router.push("/result")
                                                                │
/result ─ resultStore에 데이터 있음 ─────────────────────────────┴─▶ 렌더
        └ 없음 + ?url= ─ useQuery(["analyze", { url }], retry: false) ─ success ─▶ resultStore.open ─▶ 렌더
        └ 없음 + url 없음 ─▶ router.replace("/")
```

`apps/web/src/store/result-store.ts`:

```ts
type ResultSource = { type: "youtube"; url: string } | { type: "text"; text: string };

type ResultState = {
  source: ResultSource | null;
  data: AnalyzeData | null;
  adjustments: Record<number, { checked: boolean; userPrice: number | null }>;
  open: (source: ResultSource, data: AnalyzeData) => void;   // adjustments 초기화
  toggleIngredient: (id: number) => void;
  setUserPrice: (id: number, value: number) => void;
  clear: () => void;
};
```

- `persist` 미들웨어와 `createJSONStorage(() => sessionStorage)`를 쓰고, 키는 `recipe-web:result`다.
- 화면은 `data.ingredients`에 `adjustments`를 덮어쓴 배열로 `computeTotals`·`computeWarnings`를 호출한다(`useMemo`).
- `source.text`는 직접 입력 원문을 보관한다. 07 문서에서 북마크 저장에 쓴다(PoC가 `rawText`를 `null`로 주기 때문).
- SSR hydration 불일치를 막기 위해 persist는 `skipHydration`으로 두고 클라이언트에서 `rehydrate()`한다. hydration 전에는 r0을 보여준다.

### 5.2 트레이드오프: Zustand vs TanStack Query

| 기준 | Zustand + persist | TanStack Query (+ persister) |
| --- | --- | --- |
| OAuth 왕복·새로고침 | 기본 지원 | persister 추가 필요. 세션·북마크 캐시가 같이 저장되지 않도록 `dehydrate` 필터 필요 |
| 직접 입력 결과 | 키 없이 저장 | 쿼리 키에 원문 전체(또는 해시)가 들어감 |
| 사용자 조정값 보존 | 같은 스토어에 두면 로그인 왕복 후에도 유지 | 조정값은 서버 데이터가 아니라 Query에 둘 곳이 없음 |
| 딥링크·북마크 재요청 | 요청 코드를 직접 작성 | `useQuery` 하나로 해결(중복 제거, 오류 정책) |
| 기존 규칙 | "서버 응답을 Zustand에 두지 않는다"와 충돌 | 규칙 그대로 |
| 의존성 | 이미 설치됨 | `@tanstack/react-query-persist-client` 추가 |

**선택: 하이브리드.**
- 요청 수명주기(로딩, 오류, 중복 제거)는 Query가 잘하는 영역이라 Query에 맡긴다.
- 첫 응답 이후의 결과는 사용자가 편집하는 클라이언트 문서다. MVP 계약에도 "서버는 초기값만 주고 이후엔 FE가 소유한다"고 되어 있다. 그래서 서버 캐시를 중복 저장하는 것으로 보지 않는다.

### 5.3 컴포넌트

```
apps/web/src/app/result/page.tsx                  # 진입 규칙, 스토어 hydration
apps/web/src/components/result/
  result-header.tsx                               # 출처·제목·인분·재료 수 + BookmarkButton 자리
  savings-panel.tsx                               # r1 / r1'
  ingredients-panel.tsx                           # r2
  steps-panel.tsx                                 # r4
  ingredient-row.tsx (+ .types.ts)                # MVP 부품 13 이식. PriceInput·Tag 사용
  compare-bar.tsx (+ .types.ts)                   # MVP 부품 20 이식
apps/web/src/lib/result-note.ts                   # "집에 있는 재료 n개 N원 제외됨" 등 조정 안내 문구
```

- `IngredientRow`는 체크박스(44px 투명 input + 20px 보이는 상자), 이름과 분량, 서브 줄(구매 단위·환산 근거), 태그(추정/확인 필요/금액 없음), 금액 또는 PriceInput으로 구성된다.
- 체크를 해제한 행은 남겨 두고 금액에 취소선을 긋는다. 얼마가 빠졌는지 보여야 하기 때문이다.
- 조리법 탭은 `steps`가 비어 있으면 "조리 순서가 정리되어 있지 않습니다"를 보여주고, 원문은 `<details>`로 접는다.

### 5.4 홈 변경

- [use-home-analysis.ts](../../apps/web/src/hooks/use-home-analysis.ts): mutation이 `success`이면 `resultStore.open()`을 호출하고 `router.push("/result")`로 이동한다.
- [analysis-outcome.tsx](../../apps/web/src/components/home/analysis-outcome.tsx): success 카드를 삭제한다. 실패 카드는 유지한다.

## 6. 결정사항

| 결정 | 고려한 대안 | 선택 이유 |
| --- | --- | --- |
| 하이브리드(Query 요청 + Zustand 결과 문서) | Zustand만, Query만 | 5.2 표 참고 |
| 조정값도 persist한다 | MVP처럼 화면 로컬 상태 | 비로그인 상태에서 북마크를 누르면 카카오 로그인으로 페이지 전체가 이동한다. 돌아왔을 때 조정값이 사라지면 사용자가 다시 입력해야 한다. |
| 새 분석을 열면 조정값을 초기화한다 | 출처별로 조정값 보관 | 결과는 한 번에 하나만 본다. 이전 레시피의 조정값이 섞이면 안 된다. |
| `/result`는 단일 라우트이고 탭은 상태다 | `/result/ingredients` 등 하위 라우트 | MVP 동작 규칙 11항. 탭 전환이 히스토리에 쌓이지 않는다. |
| 딥링크는 유튜브만 지원한다 | 직접 입력도 URL에 담기 | 원문이 길고, 주소에 개인 입력이 남는다. |
| 상단 입력창은 제외한다 | MVP처럼 노출 | 홈 입력 상태를 결과 화면과 공유하려면 상태 구조가 커진다. 1차에서는 링크로 충분하다. |

## 7. 예외·오류 처리

- 재분석 결과가 `no_recipe_found`나 `error`이면 rx를 보여준다. "홈으로"를 누르면 스토어를 비우고 홈으로 간다.
- sessionStorage 접근이 실패하면(사생활 보호 모드 등) persist 없이 메모리로만 동작한다. 새로고침하면 사라진다.
- persist된 데이터가 현재 스키마와 맞지 않으면(배포 후 계약 변경) `analyzeDataSchema.safeParse` 실패로 보고 스토어를 비운다. 이후 진입 규칙을 따른다.
- 직접 입력 금액은 0 이상의 정수만 받는다. 빈 값은 0으로 다룬다.

## 8. 영향 범위

- [api-common-policy.md](./api-common-policy.md): "서버 응답을 Zustand에 저장하지 않는다" 규칙에 예외(편집 가능한 결과 문서)와 근거를 추가한다.
- [AGENTS.md](../../AGENTS.md): `store/`가 더 이상 placeholder가 아님을 반영한다.
- 홈: [use-home-analysis.ts](../../apps/web/src/hooks/use-home-analysis.ts), [analysis-outcome.tsx](../../apps/web/src/components/home/analysis-outcome.tsx)

## 9. 테스트 / 완료 기준

- 스토어 테스트: open → 조정값 초기화, toggle·setUserPrice, persist 키, 스키마 불일치 시 비우기
- `result-note` 테스트: 제외됨, 직접 입력, 입력 대기 문구 우선순위
- 수동 시나리오:
  1. 홈 분석 → 결과 → 재료 체크 해제 → 절약액 변화 → 새로고침 → 조정값 유지
  2. `/result?url=` 새 탭으로 열기 → 재분석 → 결과
  3. 매장가 없는 레시피 → r1'
  4. 주재료 가격 없음 → 경고 Banner, 금액 입력 시 경고 사라짐
  5. 스토어도 url도 없이 `/result` 접근 → 홈으로 replace
- `pnpm lint`, `pnpm --filter web test`, `tsc --noEmit`, `pnpm build` 통과

## 10. 미결 사항

- 결과 화면 상단 입력창(MVP 기능)을 2차에서 넣을지
- 조리 단계 추출이 PoC에 생기기 전까지 r4 탭을 숨길지 보여줄지. 현재 설계는 보여주고 원문을 접는다.
