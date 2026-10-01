import { describe, expect, it } from "vitest";
import { isYoutubeUrl } from "./is-youtube-url";

describe("isYoutubeUrl", () => {
  it.each([
    "https://www.youtube.com/watch?v=abc123",
    "youtu.be/abc123",
    " https://m.youtube.com/shorts/abc123 ",
    "https://youtube.com/live/abc123",
  ])("지원하는 주소 형식을 받는다: %s", (value) => {
    expect(isYoutubeUrl(value)).toBe(true);
  });

  it.each(["", "https://blog.naver.com/recipe/123", "youtube.com/channel/abc"])(
    "지원하지 않는 주소를 거부한다: %s",
    (value) => {
      expect(isYoutubeUrl(value)).toBe(false);
    },
  );
});
