# 05. 2차 공용 컴포넌트 설계

- 작성자: 김도혁
- 날짜: 2026-10-02

## 1. 개요

결과 화면과 팬트리 화면에 필요한 범용 UI 부품 4종을 `packages/ui`에 추가한다.

- 선행 문서: [UI 공용 컴포넌트 설계](./ui-components.md)(1차, 규칙의 출처)
- 후속 문서: [06 결과 화면](./06-result-screen.md), [07 북마크 저장·열기](./07-bookmark-save-open.md), [08 팬트리 화면](./08-pantry-screen.md)

## 2. 목표 / 비목표

### 목표

- `TabBar`, `Chip`·`ChipAddInput`, `PriceInput`, `BookmarkButton`을 `packages/ui`에 추가하고 Storybook 스토리를 붙인다.

### 비목표

- 레시피 데이터를 아는 부품(`IngredientRow`, `CompareBar`)은 이 문서 범위가 아니다. [06 문서](./06-result-screen.md)에서 앱 컴포넌트로 만든다.
- `ListRow` 변경. 이미 `trailing`, `onOpen`, `href`를 지원하고 `title`이 `ReactNode`라 태그도 붙일 수 있다.
- `ModeSwitch`, `Modal`, `KakaoButton` 추출. 지금은 앱에 인라인으로 구현돼 있고 사용처가 하나뿐이다.

## 3. 배경 / 현재 상태

- `packages/ui`에는 1차 8종(Button, TextLink, Tag, Banner, ListRow, NoticeCard, Skeleton, Toast)이 있다.
- MVP 원본은 `src/components/recibi/ui/{TabBar,Chip,PriceInput,BookmarkButton}`이다. 시트 번호는 08, 14, 12, 05다.
- MVP와 달라지는 점:
  - 임의 글자 크기(`text-[13px]` 등)를 쓰지 않고 크기 단계 토큰으로 바꾼다.
  - 문구를 props로 받는다.
  - 레시피 관련 이름(`pantry-add-input` 등)을 범용 이름으로 바꾼다.

## 4. 배치 기준

| 위치 | 기준 | 해당 부품 |
| --- | --- | --- |
| `packages/ui` | 레시피를 몰라도 되는 부품. API 타입·계산식·문구를 갖지 않는다 | TabBar, Chip, ChipAddInput, PriceInput, BookmarkButton |
| `apps/web/src/components/result/` | 레시피 데이터(재료 행, 매장가)를 직접 다루는 부품 | IngredientRow, CompareBar (06 문서) |

## 5. 상세 설계

공통 규칙은 [ui-components.md](./ui-components.md)의 "구현 규칙"을 그대로 따른다.
- 화살표 함수, named export, kebab-case 파일
- 반경 0, 비활성에 opacity 금지, `:focus-visible`, 클릭 영역 44px, 크기 단계 토큰, 애니메이션 없음
- props 타입은 같은 폴더의 `*.types.ts`에 둔다.

### 5.1 TabBar (시트 08)

```ts
type TabItem = { key: string; label: string; meta?: string };
type TabBarProps = {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  idPrefix?: string;   // 기본 "tab". tab/panel id 생성용
  sticky?: boolean;    // 기본 true
};
```

- WAI-ARIA tabs 패턴을 따른다. `role="tablist"`/`"tab"`, `aria-selected`, `aria-controls={`${idPrefix}-panel-${key}`}`.
- 좌우 화살표로 탭을 이동한다. MVP에는 없던 기능이다. 선택된 탭만 `tabIndex=0`이다.
- 패널은 호출하는 쪽이 렌더링한다. `getTabPanelProps(idPrefix, key)` 헬퍼를 함께 export한다.

### 5.2 Chip · ChipAddInput (시트 14)

```ts
type ChipProps =
  | { variant: "selected"; label: string; onRemove: () => void; removeLabel?: string }
  | { variant: "addable"; label: string; onAdd: () => void; disabled?: boolean };

type ChipAddInputProps = Omit<ComponentProps<"input">, "onChange" | "value"> & {
  label: string;               // 스크린리더용
  maxLength?: number;          // 기본 10
  onAdd: (value: string) => void;
};
```

- MVP의 `selected`/`addable` 불리언 조합을 판별 유니온으로 바꾼다. 불가능한 조합을 막기 위해서다.
- `ChipAddInput`은 Enter로 추가하고, trim 후 빈 값이면 무시하고, 추가 후 입력을 비운다. 한글 IME 조합 중 Enter(`isComposing`)는 무시한다.
- `disabled`일 때 MVP는 입력칸을 아예 숨겼다. 우리는 숨기지 않고 비활성으로 보여준다. 숨길지는 화면이 결정한다.

### 5.3 PriceInput (시트 12)

```ts
type PriceInputProps = Omit<ComponentProps<"input">, "value" | "onChange" | "type"> & {
  label: string;
  value: number;                 // 0이면 빈 칸으로 표시
  onValueChange: (value: number) => void;
  unit?: string;                 // 기본 "원"
};
```

- `type="text"` + `inputMode="numeric"`을 쓰고, 숫자 외 문자는 제거한다. `type="number"`의 휠 변경과 `e` 입력 문제를 피하기 위해서다.
- 빈 값과 0은 같게 다룬다(MVP 규칙 4-2). 음수와 소수는 허용하지 않는다.
- 천 단위 쉼표는 표시하지 않는다(1차). 입력 중 커서 위치 문제가 생기기 때문이다.

### 5.4 BookmarkButton (시트 05)

```ts
type BookmarkButtonProps = ComponentProps<"button"> & {
  active: boolean;
  label?: string;          // 기본 "북마크"
  activeLabel?: string;    // 기본 "북마크 됨"
  loading?: boolean;
};
```

- `aria-pressed={active}`를 쓴다.
- `loading`이면 `disabled` + `aria-busy`. 라벨 폭은 Button과 같은 grid 겹치기로 고정한다.

## 6. 결정사항

| 결정 | 고려한 대안 | 선택 이유 |
| --- | --- | --- |
| 범용 4종만 ui, 도메인 부품은 앱 | 전부 ui, 또는 전부 앱 | ui 패키지는 API 타입과 계산식을 import하지 않는다는 기존 규칙을 지킨다. 범용 부품은 Storybook에서 독립적으로 검수할 수 있다. |
| ListRow는 바꾸지 않는다 | `titleTag` prop 추가 | `title: ReactNode`로 이미 태그를 붙일 수 있다. API를 늘릴 이유가 없다. |
| Chip을 판별 유니온으로 | MVP 불리언 props | `selected`와 `addable`이 동시에 true인 잘못된 상태를 타입으로 막는다. |
| PriceInput은 `type="text"` | `type="number"` | 스크롤 휠로 값이 바뀌는 문제, 지수 표기 입력 문제를 막는다. |

## 7. 예외·오류 처리

- `TabBar`의 `activeKey`가 `tabs`에 없으면 첫 탭을 선택된 것으로 렌더링한다.
- `ChipAddInput`은 `maxLength` 초과 입력을 브라우저 속성으로 막는다. 중복 판단은 화면이 한다.

## 8. 영향 범위

- `packages/ui/src/index.ts`: export 추가
- [ui-components.md](./ui-components.md): 컴포넌트 목록 표에 4종 추가(사용 화면 열 포함)

## 9. 테스트 / 완료 기준

- 각 부품의 Storybook 스토리: 기본, 호버, 눌림, 초점, 비활성, 로딩(해당 시)
- 키보드: TabBar 화살표 이동, ChipAddInput Enter·IME, PriceInput 숫자만 입력
- 스크린리더 이름: 탭, 칩 제거 버튼, 금액 입력
- `pnpm lint`, `pnpm --filter @recipe-web/ui typecheck` 통과

## 10. 미결 사항

- 시트에 TabBar 화살표 키 이동이 정의돼 있지 않다. 디자인(황유림님)과 확인이 필요하다.
