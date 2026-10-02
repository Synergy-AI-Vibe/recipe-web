import { describe, expect, it } from "vitest";
import { topicParticle } from "@/lib/korean";

describe("topicParticle", () => {
  it("받침이 있으면 은을 붙인다", () => {
    expect(topicParticle("사골육수 팩")).toBe("은");
    expect(topicParticle("김치")).toBe("는");
  });

  it("받침이 없으면 는을 붙인다", () => {
    expect(topicParticle("후추")).toBe("는");
    expect(topicParticle("재료 2개")).toBe("는");
  });

  it("한글로 끝나지 않으면 은(는)으로 쓴다", () => {
    expect(topicParticle("MSG")).toBe("은(는)");
    expect(topicParticle("")).toBe("은(는)");
  });
});
