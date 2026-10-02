import { describe, expect, it } from "vitest";
import type { AnalyzeData, Bookmark } from "@recipe-web/api";
import {
  buildBookmarkInput,
  findSavedBookmark,
  getBookmarkOpenTarget,
  getCreateOutcome,
} from "@/lib/bookmark-input";

const data = { recipe: { title: "김치찌개", servings: 2 } } as AnalyzeData;

const bookmark = (overrides: Partial<Bookmark>): Bookmark => ({
  id: 1,
  title: "김치찌개",
  sourceType: "youtube",
  sourceUrl: "https://youtu.be/a",
  servings: 2,
  rawText: null,
  createdAt: "2026-10-02T00:00:00Z",
  ...overrides,
});

describe("buildBookmarkInput", () => {
  it("유튜브 결과는 주소를 저장하고 원문은 보내지 않는다", () => {
    expect(buildBookmarkInput({ type: "youtube", url: "https://youtu.be/a" }, data)).toEqual({
      sourceType: "youtube",
      sourceUrl: "https://youtu.be/a",
      title: "김치찌개",
      servings: 2,
    });
  });

  it("직접 입력 결과는 앞뒤 공백을 지운 원문을 저장하고 주소는 보내지 않는다", () => {
    expect(buildBookmarkInput({ type: "text", text: "  김치 1포기\n  " }, data)).toEqual({
      sourceType: "manual",
      rawText: "김치 1포기",
      title: "김치찌개",
      servings: 2,
    });
  });
});

describe("findSavedBookmark", () => {
  it("결과가 없으면 찾지 않는다", () => {
    expect(findSavedBookmark([bookmark({})], null)).toBeNull();
  });

  it("유튜브는 같은 주소의 북마크를 찾는다", () => {
    const items = [bookmark({ id: 1, sourceUrl: "https://youtu.be/b" }), bookmark({ id: 2 })];
    expect(findSavedBookmark(items, { type: "youtube", url: "https://youtu.be/a" })?.id).toBe(2);
  });

  it("유튜브는 직접 입력 북마크와 섞이지 않는다", () => {
    const items = [bookmark({ id: 1, sourceType: "manual", sourceUrl: null, rawText: "https://youtu.be/a" })];
    expect(findSavedBookmark(items, { type: "youtube", url: "https://youtu.be/a" })).toBeNull();
  });

  it("직접 입력은 앞뒤 공백이 달라도 같은 원문이면 찾는다", () => {
    const items = [bookmark({ id: 3, sourceType: "manual", sourceUrl: null, rawText: "김치 1포기 " })];
    expect(findSavedBookmark(items, { type: "text", text: " 김치 1포기" })?.id).toBe(3);
  });

  it("직접 입력은 원문이 다르거나 원문이 없는 북마크는 찾지 않는다", () => {
    const items = [
      bookmark({ id: 3, sourceType: "manual", sourceUrl: null, rawText: "두부 1모" }),
      bookmark({ id: 4, sourceType: "manual", sourceUrl: null, rawText: null }),
    ];
    expect(findSavedBookmark(items, { type: "text", text: "김치 1포기" })).toBeNull();
  });
});

describe("getBookmarkOpenTarget", () => {
  it("유튜브는 주소를 인코딩한 결과 페이지 링크로 연다", () => {
    expect(getBookmarkOpenTarget(bookmark({ sourceUrl: "https://youtu.be/a?t=1&x=2" }))).toEqual({
      kind: "link",
      href: "/result?url=https%3A%2F%2Fyoutu.be%2Fa%3Ft%3D1%26x%3D2",
    });
  });

  it("원문이 있는 직접 입력은 원문으로 다시 분석해 연다", () => {
    const item = bookmark({ sourceType: "manual", sourceUrl: null, rawText: " 김치 1포기 " });
    expect(getBookmarkOpenTarget(item)).toEqual({ kind: "text", text: "김치 1포기" });
  });

  it("원문이 없거나 비어 있는 직접 입력은 열 수 없다", () => {
    expect(getBookmarkOpenTarget(bookmark({ sourceType: "manual", sourceUrl: null, rawText: null }))).toEqual({
      kind: "unavailable",
    });
    expect(getBookmarkOpenTarget(bookmark({ sourceType: "manual", sourceUrl: null, rawText: "  " }))).toEqual({
      kind: "unavailable",
    });
  });

  it("주소가 없는 유튜브 북마크는 열 수 없다", () => {
    expect(getBookmarkOpenTarget(bookmark({ sourceUrl: null }))).toEqual({ kind: "unavailable" });
  });
});

describe("getCreateOutcome", () => {
  const failure = (reason: "unauthorized" | "limit" | "duplicate" | "error") =>
    ({ ok: false, reason, message: "m" }) as const;

  it("저장 성공은 saved", () => {
    expect(getCreateOutcome({ ok: true, bookmark: bookmark({}) })).toBe("saved");
  });

  it("로그인이 풀렸으면 로그인 창을 띄운다", () => {
    expect(getCreateOutcome(failure("unauthorized"))).toBe("login");
  });

  it("5개가 가득 차면 북마크 목록으로 보낸다", () => {
    expect(getCreateOutcome(failure("limit"))).toBe("limit");
  });

  it("이미 저장된 경우와 그 밖의 실패는 따로 안내하지 않는다", () => {
    expect(getCreateOutcome(failure("duplicate"))).toBe("ignored");
    expect(getCreateOutcome(failure("error"))).toBe("ignored");
  });
});
