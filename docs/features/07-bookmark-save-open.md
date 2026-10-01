# 07. 북마크 저장·열기 설계

- 작성자: 김도혁
- 날짜: 2026-10-02

## 1. 개요

결과 화면에서 레시피를 북마크로 저장하거나 해제하고, 북마크 목록에서 저장한 레시피를 다시 여는 흐름을 만든다.
다시 열면 그날 가격으로 다시 계산한다.

- 선행 문서: [03 북마크·계정 API](./03-bookmark-api.md), [05 2차 공용 컴포넌트](./05-ui-components-2.md), [06 결과 화면](./06-result-screen.md)

## 2. 목표 / 비목표

### 목표

- 결과 화면 `BookmarkButton`에 저장과 해제를 연결한다.
- 비로그인 상태에서 북마크를 누르면 로그인한 뒤 같은 결과로 돌아온다(조정값 포함).
- 북마크 목록의 행을 열면 결과 화면으로 간다. 유튜브와 직접 입력 모두 지원한다.

### 비목표

- 북마크 목록 화면 자체의 개편. 목록과 삭제는 이미 구현돼 있다.
- 오프라인에서 북마크 열기

## 3. 배경 / 현재 상태

- [bookmarks/page.tsx](../../apps/web/src/app/bookmarks/page.tsx): 목록과 삭제는 동작하지만 행 열기(`onOpen`)는 연결돼 있지 않다.
- [login-dialog.tsx](../../apps/web/src/components/login-dialog.tsx): `redirectTo`의 `next`에 `pathname`만 넣는다. `/result?url=...`의 쿼리가 빠진다.
- [auth/callback/route.ts](../../apps/web/src/app/auth/callback/route.ts): `next`가 같은 출처의 내부 경로인지 검증한다. 쿼리 포함 경로도 허용한다.
- MVP 원본: `src/app/result/page.tsx`의 `handleBookmarkClick`
- MVP와 달라지는 점:
  - MVP는 직접 입력 북마크를 저장할 수는 있었지만 다시 열 수 없었다.
  - 우리는 원문을 저장해서 다시 열 수 있게 한다(03 문서).

## 4. 사용자 시나리오

### 저장

| 상황 | 동작 |
| --- | --- |
| 로그인, 미저장 | 저장 → 버튼 "북마크 됨" |
| 로그인, 저장됨 | 해제(삭제) → 버튼 "북마크" |
| 비로그인 | 로그인 모달 → 카카오 → `/result`로 복귀. 결과와 조정값은 유지된다. 자동 저장하지 않으므로 사용자가 다시 누른다 |
| 5개 가득(`limit`) | 저장하지 않고 알림 없이 `/bookmarks`로 이동. 목록 상단 Banner가 이유를 설명한다 |
| 이미 저장(`duplicate`) | 무시. 목록 캐시를 무효화해서 버튼 상태를 맞춘다 |
| 그 밖의 실패 | 공통 오류 알림 |

### 열기

| 북마크 종류 | 동작 |
| --- | --- |
| 유튜브 | `/result?url=<sourceUrl>`로 이동 → 06 문서의 딥링크 재분석 |
| 직접 입력(`rawText` 있음) | 목록에서 analyze mutation(원문) → 성공 시 `resultStore.open({ type: "text", text })` → `/result` |
| 직접 입력(`rawText` 없음, MVP에서 저장한 행) | 열 수 없는 행(`onOpen` 없음). meta에 "다시 열 수 없는 항목"을 표시 |

## 5. 상세 설계

### 5.1 저장 상태 판별

- 결과 화면은 로그인 상태일 때 `useBookmarks`로 목록을 조회해서 현재 결과와 같은 북마크를 찾는다.
  - 유튜브: `sourceUrl`이 같은 항목
  - 직접 입력: `rawText`가 같은 항목. 원문 전체를 비교하고, 앞뒤 공백은 정규화한다.
- 찾으면 `active=true`이고, 그 항목의 `id`로 해제한다.

### 5.2 Query 정의 (`apps/web/src/queries/bookmarks.ts`)

```ts
useCreateBookmark()   // mutationFn: createBookmark(getApiClient(), input)
                      // meta: { errorMode: "local" }  — reason 분기는 화면이 한다
                      // onSettled: invalidate bookmarkQueryKeys.all
useDeleteBookmark()   // 기존 hook 재사용
```

저장 입력값은 결과 스토어에서 만든다.

```ts
{
  title: data.recipe.title,
  sourceType: source.type === "youtube" ? "youtube" : "manual",
  sourceUrl: source.type === "youtube" ? source.url : null,
  servings: data.recipe.servings,
  rawText: source.type === "text" ? source.text : null,
}
```

### 5.3 로그인 복귀 경로

- `login-dialog.tsx`의 `next`를 `pathname`에서 `pathname + search`로 바꾼다(`useSearchParams`).
- 06 문서의 스토어가 sessionStorage에 persist되므로, 복귀한 `/result`는 같은 결과와 조정값을 렌더링한다.

### 5.4 북마크 행 열기

- `bookmarks/page.tsx`의 `ListRow`에 `onOpen`을 연결한다. 유튜브는 `href` + `linkAs={Link}`를 쓴다.
- 직접 입력 열기 중에는 해당 행에 "계산 중" 상태를 보여주고 다른 행 열기를 막는다. 실패하면 행 아래에 오류 문구를 보여준다(삭제 실패와 같은 패턴).

## 6. 결정사항

| 결정 | 고려한 대안 | 선택 이유 |
| --- | --- | --- |
| 로그인 후 자동 저장하지 않는다 | 로그인 직후 대기 중이던 저장 실행 | 의도치 않은 저장이 생길 수 있고, 5개 가득 같은 분기가 로그인 직후에 튀어나와 혼란스럽다. 결과와 조정값이 남아 있으므로 한 번 더 누르는 비용은 작다. |
| `limit`이면 알림 없이 이동 | 토스트, 모달 | MVP 동작 규칙(b3). 목록 화면 Banner가 이유와 해결 방법(지우기)을 함께 보여준다. |
| 해제는 확인 없이 즉시 | 확인 모달 | 목록 삭제와 같은 규칙이다. 다시 누르면 저장되므로 되돌릴 수 있다. |
| 직접 입력은 원문 비교로 저장 여부를 판별 | 판별하지 않음 | DB가 직접 입력 중복을 막지 않는다(03 문서). 화면에서라도 중복 저장을 줄인다. |
| 원문 없는 기존 직접 입력 행은 비활성 | 숨김, 삭제 | 사용자 데이터를 임의로 숨기거나 지우지 않는다. 삭제는 사용자가 할 수 있다. |

## 7. 예외·오류 처리

- 저장 요청 중에는 버튼을 `loading`으로 두어 연타를 막는다.
- 북마크 목록 조회가 실패하면 저장 여부를 알 수 없다. 버튼은 "북마크"로 보여주고, 저장 시 `duplicate`가 오면 무시한다.
- 세션이 만료된 상태에서 저장하면 `unauthorized`가 온다. 이때는 로그인 모달을 띄운다.

## 8. 영향 범위

- [queries/bookmarks.ts](../../apps/web/src/queries/bookmarks.ts): `useCreateBookmark` 추가
- [bookmarks/page.tsx](../../apps/web/src/app/bookmarks/page.tsx): 행 열기 연결
- [login-dialog.tsx](../../apps/web/src/components/login-dialog.tsx): `next`에 쿼리 포함
- [frontend-backend-contract.md](./frontend-backend-contract.md): 4단계 "오프라인 읽기" 문구 삭제

## 9. 테스트 / 완료 기준

- hook 테스트(MSW): 저장 성공 시 목록 무효화, 409 `limit`·`duplicate` 반환, 401 반환
- 수동 시나리오:
  1. 비로그인 → 결과에서 재료 2개 체크 해제 → 북마크 → 카카오 로그인 → 같은 결과와 조정값으로 복귀 → 북마크 → 저장
  2. 5개 저장 상태 → 6번째 북마크 → `/bookmarks` 이동, Banner 표시
  3. 저장된 결과 → 북마크 해제 → 목록에서 사라짐
  4. 목록에서 유튜브 행 열기 → 재분석된 결과
  5. 목록에서 직접 입력 행 열기 → 재분석된 결과
  6. `/result?url=`에서 비로그인 북마크 → 로그인 → 같은 URL로 복귀
- `pnpm lint`, 테스트, `tsc --noEmit` 통과

## 10. 미결 사항

- 결과 화면에서 북마크 목록 전체를 조회하는 대신 "이 출처가 저장됐는지"만 묻는 API가 필요할지. 현재는 최대 5개라 목록 조회로 충분하다.
