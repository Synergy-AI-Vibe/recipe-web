# UI 공용 컴포넌트 설계

관련 이슈: #3 UI 공용 컴포넌트 구현

`packages/ui`에 두 곳 이상에서 쓰이는 공용 컴포넌트 8개를 만든다. 값과 상태는 synergy `12_컴포넌트시트.html`, 토큰은 [theme.css](../packages/ui/src/styles/theme.css)(Storybook `Foundations`)를 따른다.

## 컴포넌트 목록

| 컴포넌트 | 시트 번호 | 사용 화면 |
| --- | --- | --- |
| `Button` | 01 02 03 04 | 홈, 추출 실패, 결과, pantry, 로그인, 탈퇴 |
| `TextLink` | 06 | 로그인, 탈퇴, pantry |
| `Tag` | 15 | 결과(재료별), pantry 결과 |
| `Banner` | 16 | 결과(재료별), 북마크 가득 |
| `ListRow` | 17 | 북마크, pantry 결과 |
| `NoticeCard` | 21 | 추출 실패, pantry 결과 없음, 결과(기준 가격) |
| `Skeleton` | — (`11` 4-1) | 결과, 북마크, 재료 목록, pantry 결과 |
| `Toast` · `showToast` | 19 | 전역 (로그인·로그아웃·탈퇴 완료) |

## 구현 규칙

### 코드

- 화살표 함수로 작성하고 named export 한다. 파일명은 kebab-case (`button.tsx`).
- props는 해당 네이티브 요소의 props를 확장한다 (`ComponentProps<"button">` 등). `className`은 마지막에 합쳐 호출하는 쪽이 덮어쓸 수 있게 한다.
- React 19이므로 `forwardRef`를 쓰지 않고 `ref`를 일반 prop으로 받는다.
- 상호작용 상태가 있는 부품만 파일 상단에 `"use client"`를 둔다.
- 문구·계산식·API 호출·라우팅을 갖지 않는다. `next/*`도 import하지 않는다.
- 같은 폴더에 `*.stories.tsx`를 두고, 시트의 상태(기본·호버·눌림·초점·비활성·로딩·에러)를 스토리로 모두 그린다.

### 디자인

- **반경 0.** `rounded-*` 클래스를 쓰지 않는다. 리셋에 이미 `border-radius: 0`이 있다.
- **비활성에 `opacity`를 쓰지 않는다.** 배경색과 글자색을 각각 지정한다.
- **초점은 `:focus-visible`로만.** 빨강·노랑 면 위(`accent`, `kakao`)에서는 초점 테두리를 검정으로 바꾼다.
- **클릭 영역 44px.** 버튼은 높이를 44px(`h-tap`)로 고정한다. 세로 padding으로 맞추면 `className`으로 글자 크기를 바꿀 때 `tailwind-merge`가 `leading-*`를 지워 높이가 달라진다.
- **글자는 크기 단계 토큰으로만.** `text-b3`처럼 단계 클래스 하나로 크기·행간·자간·굵기가 함께 들어간다. `text-[13.5px]` 같은 임의값을 쓰지 않는다.
- **간격은 `11` 3-2항 목록의 값만.** Tailwind 기본 스케일(`p-3.75` = 15px)로 쓰되 목록에 없는 중간값을 만들지 않는다.
- **시맨틱 태그.** 버튼은 `<button>`, 목록은 `<ul>/<li>`.
- **애니메이션 없음.** 스켈레톤도 깜빡이지 않는다.

## 컴포넌트별 명세

값은 컴포넌트시트에 있으므로 여기서는 **API와 동작**만 정한다.

### Button

```ts
type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "accent" | "ghost" | "kakao"; // 기본 primary
  loading?: boolean;
  loadingLabel?: string; // 기본 "계산 중"
};
```

- `type` 기본값은 `"button"`이다 (폼 안에서 의도치 않은 submit 방지).
- `loading`이면 라벨만 `loadingLabel`로 바꾸고 `disabled` + `aria-busy`. 스피너를 넣지 않는다.
- `loading` prop을 넘기면 두 라벨을 같은 grid 칸에 겹쳐 두고 한쪽만 보이게 해서, 라벨이 바뀌어도 폭이 흔들리지 않는다.
- `ghost`의 글자색은 기본 `text-text-2`다. "취소" 버튼처럼 검정이 필요하면 `className="text-text"`로 덮는다.
- 실패 카드 안 버튼은 13.5px다. 이것도 `className`으로 처리한다.

### TextLink

```ts
type TextLinkProps<T extends ElementType = "a"> = { as?: T } & ComponentProps<T>;
```

- `packages/ui`는 `next/link`를 import하지 않으므로 `as`로 주입받는다: `<TextLink as={Link} href="/">`.

### Tag

```ts
type TagProps = ComponentProps<"span"> & { tone?: "neutral" | "caution" | "inverse" };
```

- `neutral`: 출처(참가격·KAMIS·오픈마켓), 부족 N개
- `caution`: 금액 없음, 직접 입력
- `inverse`: 지금 바로 가능
- 출처 태그(padding 4px 8px)와 결과 태그(3px 8px)는 시안 값대로 다르게 둔다. 세로 padding 차이는 `className`으로 맞춘다.

### Banner

- 닫기 버튼 없음. 조건이 참인 동안 호출하는 쪽이 렌더링하고, 조건이 풀리면 사라진다.
- `role="status"`. 오류가 아니라 입력 요청·상태 안내이므로 `alert`를 쓰지 않는다.

### ListRow

```ts
type ListRowProps = {
  title: ReactNode;
  meta?: ReactNode;        // 부가정보
  trailing?: ReactNode;    // 오른쪽 금액 칸
  trailingWidth?: 96 | 104; // 북마크 96 / pantry 결과 104
  href?: string;           // 주면 링크로 연다 (추천 결과 → 결과 화면)
  linkAs?: ElementType;    // next/link 주입
  onOpen?: () => void;     // 주면 버튼으로 연다
  onRemove?: () => void;   // 있으면 삭제 × 표시 (북마크만)
  removeLabel?: string;    // 예: "돼지고기 김치찌개 삭제"
};

type ListProps = ComponentProps<"ul">; // 위 테두리 border-line-strong
```

- 행 전체 클릭과 × 버튼이 겹치므로 **버튼 안에 버튼을 넣지 않는다.** `<li>` 안에 열기 버튼(행 전체를 덮도록 늘림)과 × 버튼을 형제로 두고 ×를 위에 쌓는다. 이벤트 전파 문제도 이 구조로 사라진다.
- 행 호버 `bg-canvas`, 눌림 `bg-line`, 초점 outline offset -2px.

### NoticeCard

```ts
type NoticeCardProps = ComponentProps<"section"> & {
  variant?: "alert" | "quiet"; // alert: 테두리 검정 / quiet: 테두리 연회색
  eyebrow?: string;            // "추출 실패" — alert에서 빨강
  title?: ReactNode;
  description?: ReactNode; // 본문. 여러 줄은 
 (pre-line)
  actions?: ReactNode;
};
```

- 결과 영역을 **대체**하는 용도다. 결과 위에 겹쳐 띄우지 않는다.
- `quiet`처럼 정해진 틀이 없는 내용은 `children`으로 넣는다.

### Skeleton

```ts
type SkeletonProps = ComponentProps<"div">; // 크기는 className으로
```

- `bg-canvas` 사각형, 애니메이션 없음, `aria-hidden`. 로딩 중인 영역 쪽에 `aria-busy`를 둔다.
- 행 모양 조합(재료 행 9개, 북마크 행 4개 등)은 각 화면에서 `Skeleton`으로 만든다.

### Toast

```ts
showToast(message: string): void;
<ToastViewport /> // 앱 루트에 한 번
```

- 2,600ms 뒤 자동으로 사라진다. 닫기 버튼 없음. 연속 호출 시 이전 타이머를 지우고 문구만 교체한다(쌓이지 않음).
- `fixed bottom-7 left-1/2 -translate-x-1/2 z-30 pointer-events-none`, `role="status"` + `aria-live="polite"`.
- 상태는 모듈 스코프 스토어 + `useSyncExternalStore`로 관리한다 (ui 패키지에 Zustand 의존성을 추가하지 않는다).
- **실패 알림에 쓰지 않는다.** 문구 세 가지(로그인·로그아웃·탈퇴 완료)는 호출하는 쪽이 넘긴다.

## 파일 구조

```
packages/ui/src/
  components/
    button/
      button.tsx
      button.stories.tsx
    text-link/
    tag/
    banner/
    list-row/
    notice-card/
    skeleton/
    toast/
  lib/
    cn.ts            # className 병합
  styles/theme.css
  index.ts           # 공개 컴포넌트 re-export
```

## 착수 전 설정

1. **Tailwind 스캔 경로** — Tailwind v4 자동 감지는 `apps/web` 기준이라 `packages/ui/src`의 클래스를 놓칠 수 있다. `theme.css`에 `@source "../";`를 추가해 ui 소스를 스캔 대상에 넣는다. 첫 컴포넌트를 `apps/web`에 띄워 스타일이 적용되는지 확인한다.
2. **className 병합** — `clsx` + `tailwind-merge`를 `packages/ui` 의존성에 추가하고 `lib/cn.ts`로 감싼다. 호출하는 쪽의 `className`이 기본 스타일을 확실히 덮게 하기 위함이다. `apps/web`에서도 `@recipe-web/ui`의 `cn`을 가져다 쓴다.
   `tailwind-merge`는 커스텀 글자 크기 클래스(`text-h4`, `text-b3` …)를 색 클래스(`text-text-2`)와 구분하지 못해 둘 중 하나를 지운다. `extendTailwindMerge`로 `font-size` 그룹에 단계 이름을 등록한다.
