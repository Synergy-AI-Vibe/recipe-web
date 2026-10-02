import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { POPULAR_INGREDIENTS } from "@/constants/pantry";
import { samplePantryMenus } from "@/lib/fixtures/pantry-data";
import { getPantryHint } from "@/lib/pantry";
import { PantryPicker } from "@/components/pantry/pantry-picker";
import { PantryResults } from "@/components/pantry/pantry-results";
import type { PantryPickerProps } from "@/components/pantry/pantry-picker.types";
import type { PantryView } from "@/types/pantry";

const basePicker: PantryPickerProps = {
  chosen: [],
  isFull: false,
  hint: getPantryHint(false, false),
  popular: [...POPULAR_INGREDIENTS],
  pending: false,
  onAdd: () => undefined,
  onRemove: () => undefined,
  onClear: () => undefined,
  onSubmit: () => undefined,
};

const renderPicker = (overrides: Partial<PantryPickerProps> = {}) =>
  renderToStaticMarkup(<PantryPicker {...basePicker} {...overrides} />);

const renderResults = (view: PantryView) =>
  renderToStaticMarkup(<PantryResults view={view} onRetry={() => undefined} onReset={() => undefined} />);

describe("PantryPicker", () => {
  it("처음에는 재료 0개, 자주 쓰는 재료 12개, 비활성 찾기 버튼, 기본 안내를 보여준다", () => {
    const html = renderPicker();

    expect(html).toContain("고른 재료 0 / 5");
    expect(html.match(/<li>/g)).toHaveLength(12);
    expect(html).toContain("목록에 없는 재료는 직접 입력하고 Enter를 누르세요. 10자까지.");
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled/);
    expect(html).not.toContain("모두 지우기");
    expect(html).toContain('maxLength="10"');
  });

  it("고른 재료는 목록으로 보여주고 빼기 버튼과 모두 지우기가 나온다", () => {
    const html = renderPicker({ chosen: ["돼지고기", "신김치"], popular: ["두부"] });

    expect(html).toContain('aria-label="고른 재료"');
    expect(html).toContain("고른 재료 2 / 5");
    expect(html).toContain('aria-label="돼지고기 빼기"');
    expect(html).toContain("모두 지우기");
  });

  it("5개를 모두 골랐으면 입력칸과 자주 쓰는 재료가 비활성이고 안내가 바뀐다", () => {
    const html = renderPicker({
      chosen: ["가", "나", "다", "라", "마"],
      isFull: true,
      hint: getPantryHint(false, true),
      popular: ["두부"],
    });

    expect(html).toContain("5개까지 고를 수 있습니다");
    expect(html).toContain("하나를 지우면 다시 입력할 수 있습니다");
    expect(html).toMatch(/<input[^>]*disabled/);
    expect(html).toMatch(/<button[^>]*disabled[^>]*>[^<]*<span aria-hidden="true">＋/);
  });

  it("중복 안내는 강조색으로 보여주고 스크린리더에 알린다", () => {
    const html = renderPicker({ hint: getPantryHint(true, false) });

    expect(html).toContain("이미 담긴 재료입니다");
    expect(html).toContain("text-accent");
    expect(html).toContain('aria-live="polite"');
  });

  it("찾는 중에는 버튼이 찾는 중으로 바뀌고 비활성이다", () => {
    const html = renderPicker({ chosen: ["두부"], pending: true });

    expect(html).toContain("찾는 중");
    expect(html).toContain('aria-busy="true"');
  });
});

describe("PantryResults", () => {
  it("요청 전에는 보여줄 결과가 없다", () => {
    const html = renderResults({ kind: "idle" });

    expect(html).not.toContain("만들 수 있는 레시피");
    expect(html).not.toContain("<h2");
  });

  it("찾는 중에는 뼈대 화면과 읽어 주는 상태 문구를 보여준다", () => {
    const html = renderResults({ kind: "loading" });

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("추천을 찾는 중입니다");
  });

  it("결과가 있으면 메뉴별로 태그, 사야 할 재료, 추가 금액을 보여준다", () => {
    const html = renderResults({ kind: "success", menus: samplePantryMenus });

    expect(html).toContain("만들 수 있는 레시피");
    expect(html).toContain("추가 구매 금액이 적은 순 3개");
    expect(html).toContain("지금 바로 가능");
    expect(html).toContain("부족 2개");
    expect(html).toContain("사야 할 재료 두부, 대파");
    expect(html).toContain("추가 0원");
    expect(html).toContain("추가 3,500원");
    expect(html).toContain("최소 3,000원");
    expect(html).toContain("가격 미확인 1개");
    expect(html).toContain("만들 수 있는 레시피 3개를 찾았습니다");
  });

  it("추천 메뉴에는 절약 금액을 보여주지 않고 행은 눌러서 열 수 없다", () => {
    const html = renderResults({ kind: "success", menus: samplePantryMenus });

    expect(html).not.toContain("절약");
    expect(html).not.toContain("data-list-row-open");
    expect(html).toContain("최소 구매 단위(팩)");
  });

  it("추천 없음은 재료 다시 고르기와 링크로 계산하기를 안내한다", () => {
    const html = renderResults({ kind: "empty" });

    expect(html).toContain("이 재료로 만들 수 있는 레시피가 없어요");
    expect(html).toContain("재료 다시 고르기");
    expect(html).toContain('href="/"');
    expect(html).not.toContain("다시 시도");
  });

  it("실패는 추천 없음과 달리 다시 시도를 안내한다", () => {
    const html = renderResults({ kind: "failed" });

    expect(html).toContain("추천을 불러오지 못했어요");
    expect(html).toContain("다시 시도");
    expect(html).not.toContain("재료 다시 고르기");
  });
});
