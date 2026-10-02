import { describe, expect, it } from "vitest";
import { formatMonthDay } from "@/lib/format-date";

describe("formatMonthDay", () => {
  it("날짜를 월과 일로 줄여 보여 준다", () => {
    expect(formatMonthDay("2026-09-01")).toBe("9월 1일");
    expect(formatMonthDay("2026-12-25T00:00:00Z")).toBe("12월 25일");
  });

  it("형식이 다르면 받은 값을 그대로 돌려준다", () => {
    expect(formatMonthDay("어제")).toBe("어제");
  });
});
