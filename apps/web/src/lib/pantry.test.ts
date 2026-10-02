import { describe, expect, it } from "vitest";
import { samplePantryMenus } from "@/lib/fixtures/pantry-data";
import {
  addIngredient,
  getCostLabel,
  getMenuMeta,
  getPantryHint,
  getResultAnnouncement,
  normalizeIngredient,
  toPantryView,
} from "@/lib/pantry";

describe("addIngredient", () => {
  it("앞뒤 공백을 지우고 재료를 담는다", () => {
    expect(addIngredient([], "  두부 ")).toEqual({ chosen: ["두부"], status: "added" });
  });

  it("빈 입력은 무시한다", () => {
    expect(addIngredient(["두부"], "   ")).toEqual({ chosen: ["두부"], status: "empty" });
  });

  it("공백이나 영문 대소문자만 다른 재료는 중복으로 본다", () => {
    expect(addIngredient(["Spam"], " spam ")).toEqual({ chosen: ["Spam"], status: "duplicate" });
    expect(addIngredient(["두부"], "두부")).toMatchObject({ status: "duplicate" });
  });

  it("5개를 넘겨 담지 않는다", () => {
    const five = ["가", "나", "다", "라", "마"];

    expect(addIngredient(five, "바")).toEqual({ chosen: five, status: "full" });
  });

  it("5번째 재료까지는 담긴다", () => {
    const four = ["가", "나", "다", "라"];

    expect(addIngredient(four, "마")).toEqual({ chosen: [...four, "마"], status: "added" });
  });
});

describe("normalizeIngredient", () => {
  it("공백과 대소문자를 없앤 값으로 비교한다", () => {
    expect(normalizeIngredient("  SPAM ")).toBe("spam");
  });
});

describe("getPantryHint", () => {
  it("중복 안내가 가득 참 안내보다 먼저다", () => {
    expect(getPantryHint(true, true)).toEqual({ text: "이미 담긴 재료입니다", tone: "alert" });
  });

  it("5개를 모두 골랐으면 지우면 다시 입력할 수 있다고 알려 준다", () => {
    expect(getPantryHint(false, true).text).toBe(
      "재료 5개를 모두 골랐습니다. 하나를 지우면 다시 입력할 수 있습니다.",
    );
  });

  it("기본 안내는 직접 입력 방법과 글자 수 제한을 알려 준다", () => {
    expect(getPantryHint(false, false)).toEqual({
      text: "목록에 없는 재료는 직접 입력하고 Enter를 누르세요. 10자까지.",
      tone: "default",
    });
  });
});

describe("toPantryView", () => {
  const idle = { isPending: false, isError: false, data: undefined };

  it("요청 전에는 아무것도 보여주지 않는다", () => {
    expect(toPantryView(idle)).toEqual({ kind: "idle" });
  });

  it("요청 중이면 찾는 중이다", () => {
    expect(toPantryView({ ...idle, isPending: true })).toEqual({ kind: "loading" });
  });

  it("메뉴가 있으면 결과를 보여준다", () => {
    expect(toPantryView({ ...idle, data: { status: "success", menus: samplePantryMenus } })).toEqual({
      kind: "success",
      menus: samplePantryMenus,
    });
  });

  it("메뉴가 비어 있거나 추천 없음이면 결과 없음이다", () => {
    expect(toPantryView({ ...idle, data: { status: "success", menus: [] } })).toEqual({ kind: "empty" });
    expect(toPantryView({ ...idle, data: { status: "error", reason: "no_menu", message: "x" } })).toEqual({
      kind: "empty",
    });
  });

  it("서버 실패, 입력 오류, 요청 오류는 실패로 구분한다", () => {
    expect(toPantryView({ ...idle, data: { status: "error", reason: "failed", message: "x" } })).toEqual({
      kind: "failed",
    });
    expect(
      toPantryView({ ...idle, data: { status: "error", reason: "invalid_input", message: "x" } }),
    ).toEqual({ kind: "failed" });
    expect(toPantryView({ ...idle, isError: true })).toEqual({ kind: "failed" });
  });
});

describe("메뉴 표시", () => {
  const [ready, priced, unpriced] = samplePantryMenus;

  it("가격을 모두 확인했으면 추가 금액을 보여준다", () => {
    expect(getCostLabel(ready)).toEqual({ primary: "추가 0원", secondary: null });
    expect(getCostLabel(priced)).toEqual({ primary: "추가 3,500원", secondary: null });
  });

  it("가격 미확인이 있으면 최소 금액과 개수를 보여준다", () => {
    expect(getCostLabel(unpriced)).toEqual({ primary: "최소 3,000원", secondary: "가격 미확인 1개" });
  });

  it("추가 재료가 없으면 설명을, 있으면 사야 할 재료를 보여준다", () => {
    expect(getMenuMeta(ready)).toBe("신김치와 밥만 있으면 바로 만들 수 있습니다");
    expect(getMenuMeta(priced)).toBe("사야 할 재료 두부, 대파");
  });
});

describe("getResultAnnouncement", () => {
  it("상태에 맞는 안내 문구를 만든다", () => {
    expect(getResultAnnouncement({ kind: "idle" })).toBe("");
    expect(getResultAnnouncement({ kind: "loading" })).toBe("추천을 찾는 중입니다");
    expect(getResultAnnouncement({ kind: "success", menus: samplePantryMenus })).toBe(
      "만들 수 있는 레시피 3개를 찾았습니다",
    );
    expect(getResultAnnouncement({ kind: "empty" })).toBe("이 재료로 만들 수 있는 레시피가 없습니다");
    expect(getResultAnnouncement({ kind: "failed" })).toBe("추천을 불러오지 못했습니다");
  });
});
