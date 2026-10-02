# 08. 있는 재료로 찾기 화면 설계

- 작성자: 김도혁
- 날짜: 2026-10-02

## 1. 개요

가진 재료를 최대 5개까지 고르면, 그 재료로 만들 수 있는 메뉴를 "추가로 사야 하는 금액" 순으로 보여주는 `/pantry` 화면을 만든다.

- 선행 문서: [04 있는 재료로 찾기 API](./04-pantry-api.md), [05 2차 공용 컴포넌트](./05-ui-components-2.md)

## 2. 목표 / 비목표

### 목표

- 재료 선택: 직접 입력, 자주 쓰는 재료 칩, 선택 칩 제거, 모두 지우기
- `/api/pantry` 연동, 결과 목록 표시
- 상태 p1~p4와 오류 상태 구분

### 비목표

- 추천 메뉴를 결과 화면으로 열기. LLM 추천 메뉴에는 레시피 원문이 없다.
- 선택한 재료를 화면 이탈 후에도 보관하기
- 절약 금액 표시. 추천 메뉴에는 매장가가 없다.

## 3. 배경 / 현재 상태

- recipe-web [pantry/page.tsx](../../apps/web/src/app/pantry/page.tsx)는 제목과 설명만 있다.
- MVP 원본:
  - `src/app/pantry/page.tsx`
  - `src/lib/services/recibi/pantry-service.ts`
  - `src/lib/data/recibi/ingredients.ts`(자주 쓰는 재료 12개)
- MVP의 문제:
  - API 응답을 옛 목업 타입(`PantryMatch`)으로 바꾸면서 `savings`가 항상 0이 됐다. 그래서 "0원 절약"이 표시됐다.
  - 네트워크 오류와 서버 오류를 모두 빈 결과로 삼켜 "결과 없음" 카드를 보여줬다.
  - 가격을 모르는 재료를 이름에 "(가격 미확인)"을 붙이는 방식으로 표시했다.

## 4. 사용자 시나리오 / 화면 상태

| 코드 | 상태 | 표시 |
| --- | --- | --- |
| p1 | 시작(결과 없음) | 재료 상자(고른 재료 n/5, 입력칸, 선택 칩, 안내 한 줄), 자주 쓰는 재료, "레시피 찾기" 버튼 |
| p1' | 찾는 중 | 버튼 `loading`("찾는 중"), Skeleton 3줄 |
| p2 | 결과 있음 | "만들 수 있는 레시피" + 개수, ListRow 목록, 하단 설명 |
| p3 | 추천 없음(`no_menu`) | NoticeCard "이 재료로 만들 수 있는 레시피가 없어요" + "재료 다시 고르기" + "링크로 계산하기" |
| p4 | 5개 가득 | 입력칸 비활성, 자주 쓰는 재료 비활성, 안내 "하나를 지우면 다시 입력할 수 있습니다" |
| pe | 실패(`failed`, 네트워크, 타임아웃) | NoticeCard "추천을 불러오지 못했어요" + "다시 시도" |

### 규칙

- 재료는 최대 5개, 각 10자까지다. 대소문자와 앞뒤 공백을 무시하고 중복을 판별한다. 중복이면 상자 안내를 "이미 담긴 재료입니다"(강조색)로 바꾼다.
- 재료를 추가하거나 빼면 결과(p2·p3·pe)를 지운다. 결과가 고른 재료와 어긋나지 않게 하기 위해서다(MVP 7-3).
- 자주 쓰는 재료 중 이미 고른 것은 목록에서 숨긴다.
- 상자 안내는 한 줄이다. 우선순위는 중복 → 가득 참 → 기본 안내 순이다.

### 결과 행

| 요소 | 내용 |
| --- | --- |
| 제목 | 메뉴 이름 + Tag. 추가 재료가 0개면 "지금 바로 가능"(`inverse`), 아니면 "부족 n개"(`neutral`) |
| meta | 추가 재료가 없으면 `description`. 있으면 "사야 할 재료 A, B, C" |
| trailing | `unpricedCount === 0`이면 "추가 N원". 아니면 "최소 N원"과 그 아래 "가격 미확인 n개" |
| 열기 | 없음(누를 수 없는 행) |

## 5. 상세 설계

### 5.1 파일 배치

```
packages/api/src/schemas/pantry.ts         # 요청·응답 Zod 스키마 (계약 정본)
packages/api/src/client/pantry.ts          # searchPantry (요청별 대기 시간 60초)
packages/ui/src/components/chip/           # Chip(selected·addable), ChipAddInput, 스토리
apps/web/src/app/pantry/page.tsx           # 제목·소개 + PantryContent
apps/web/src/components/pantry/
  pantry-content.tsx                       # 훅 연결 (클라이언트)
  pantry-picker.tsx (+ .types.ts)          # 재료 상자 + 자주 쓰는 재료 + 버튼
  pantry-results.tsx (+ .types.ts)         # 찾는 중·결과·추천 없음·실패
  pantry-menu-row.tsx (+ .types.ts)        # 결과 한 줄
apps/web/src/hooks/use-pantry.ts           # 선택 목록 + 검색 요청을 묶는 훅
apps/web/src/queries/pantry.ts             # useSearchPantry (mutation)
apps/web/src/lib/pantry.ts                 # 재료 추가 규칙, 안내 문구, 결과 상태 판별, 금액 표시
apps/web/src/types/pantry.ts               # 화면 타입
apps/web/src/constants/pantry.ts           # 자주 쓰는 재료 12개
apps/web/src/lib/fixtures/pantry-data.ts   # 샘플 추천 결과 (테스트·미리보기용)
apps/web/src/app/pantry-preview/           # 임시 미리보기 (서버 연동 후 삭제)
```

### 5.2 데이터 흐름

```
선택 변경 ─▶ usePantry 상태 갱신 + search.reset()
"레시피 찾기" ─▶ useSearchPantry.mutate(labels)
   ├ success(메뉴 있음) ─▶ p2
   ├ success(메뉴 없음), error/no_menu ─▶ p3
   └ error/failed·invalid_input, 요청 예외 ─▶ pe
```

- 응답 상태 판별은 `toPantryView`가 한다. 입력 규칙(5개·10자·중복)은 `addIngredient`가 한다.
- 5개와 10자 제한은 API 스키마의 상수(`PANTRY_MAX_INGREDIENTS`, `PANTRY_MAX_NAME_LENGTH`)를 화면이 그대로 쓴다.

- 요청은 mutation이다. 같은 재료로 다시 찾기를 눌러도 캐시가 아니라 새 요청을 보낸다. 서버 메모리 캐시가 비용을 줄인다.
- `meta: { errorMode: "local" }`로 공통 알림을 끄고 pe 카드로 표시한다.
- 화면을 떠나면 상태가 사라진다(컴포넌트 로컬 상태).

## 6. 결정사항

| 결정 | 고려한 대안 | 선택 이유 |
| --- | --- | --- |
| API 응답(`PantryMenu`)을 그대로 렌더링한다 | MVP의 `PantryMatch` 변환 유지 | 변환 과정에서 정보가 사라지고(`unpricedCount`) 잘못된 값이 생겼다("0원 절약"). |
| 절약 금액을 표시하지 않는다 | 추정 매장가로 계산 | 추천 메뉴에는 매장가 근거가 없다. 근거 없는 금액은 보여주지 않는다. |
| 가격 미확인은 "최소 N원 · 가격 미확인 n개" | 이름에 "(가격 미확인)" 붙이기 | 금액이 하한값이라는 사실이 금액 옆에서 바로 읽혀야 한다. |
| p3(추천 없음)와 pe(실패)를 나눈다 | MVP처럼 합침 | 사용자의 다음 행동이 다르다. 재료를 바꿔야 하는지, 다시 시도하면 되는지가 갈린다. |
| 결과 행은 열 수 없다 | 메뉴 이름으로 텍스트 분석 | 원문 없이 분석하면 재료와 분량이 지어낸 값이 된다. |
| 선택 상태는 화면 로컬 | Zustand에 보관 | 다른 화면과 공유할 필요가 없다. |
| 하단 설명을 "최소 구매 단위(팩)로 샀을 때의 합계"로 쓴다 | MVP 문구("쓰는 양만큼만 계산한 값") 유지 | 서버는 부족한 재료의 구매 단위 가격을 더한다([04 문서](./04-pantry-api.md)). MVP 문구는 실제 계산과 달랐다. |
| 요청 스키마·함수(`searchPantry`)를 이 작업에서 구현한다 | [04 문서](./04-pantry-api.md) 작업까지 임시 타입 사용 | 화면이 응답 형식에 직접 의존한다. 같은 일을 두 번 하지 않도록 04 문서 작업은 서버 쪽만 남는다. |
| 금액 표시 함수를 `lib/pantry.ts` 안에 둔다 | 공용 금액 표시 함수(`calc.ts`) 재사용 | 이 작업은 결과 페이지 작업(#17)이 합쳐지기 전 브랜치라 `calc.ts`가 없다. 합쳐진 뒤 하나로 합친다. |

## 7. 예외·오류 처리

- 요청 중에 재료를 바꿀 수는 있다. 단, 바꾸는 즉시 진행 중인 결과는 버린다(`reset`). 응답이 늦게 도착해도 표시하지 않는다.
- 60초 타임아웃이 나면 pe를 보여준다.
- 서버 `invalid_input`은 화면 검증 때문에 정상적으로는 오지 않는다. 오면 pe와 같이 처리한다.

## 8. 영향 범위

- 기존 `Tag`를 그대로 쓴다. "지금 바로 가능"은 `tone="inverse"`, "부족 n개"는 `tone="neutral"` + `className="py-0.75"`다.
- `packages/ui`에 `Chip`, `ChipAddInput`을 추가한다([05 문서](./05-ui-components-2.md)).
- `packages/api`에 있는 재료로 찾기 스키마와 `searchPantry`를 추가한다.
- [pantry/page.tsx](../../apps/web/src/app/pantry/page.tsx): 전면 교체
- 서버 연동 전 확인용 임시 페이지 `/pantry-preview`(결과 상태 4종)를 둔다. 서버 연동 후 삭제한다.

## 9. 테스트 / 완료 기준

- 규칙 테스트(`lib/pantry`): 5개 제한, 중복(대소문자·공백), 빈 입력, 안내 우선순위, 결과 상태 판별, 금액·태그 표시
- 화면 렌더링 테스트: 처음·5개 가득·중복 안내·찾는 중, 결과 있음·추천 없음·실패
- API 테스트: 성공, 추천 없음, 서버 실패(502), 형식 오류, 대기 시간 60초
- 수동 시나리오:
  1. 자주 쓰는 재료 3개 → 찾기 → p2
  2. 5개 선택 → p4
  3. 중복 입력 → 안내
  4. 찾는 중 재료 변경 → 결과 버림
  5. 서버 키 제거 → pe → 다시 시도
- `pnpm lint`, `pnpm --filter web test`, `tsc --noEmit` 통과

## 10. 미결 사항

- 자주 쓰는 재료 12개 목록을 디자인 시안과 다시 맞출지(MVP 값 그대로 사용)
- "가격 미확인 n개"의 빨간 글자(`#e23e2e`)의 색 대비가 4.23:1로 기준(4.5:1)에 못 미친다. 디자인 시스템 색 토큰이라 디자인 협의가 필요하다.
