import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// theme.css의 커스텀 토큰을 등록해야 `text-b3`(글자 크기)와 `text-text-2`(색)를 서로 다른 그룹으로 인식합니다.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "d1", "d2", "d3",
        "h1", "h2", "h3", "h4", "h5", "h6",
        "s1", "s2",
        "b1", "b1b", "b2", "b2-bar", "b3", "b4",
        "n1", "c1", "c2", "l1", "l1-strong", "l2", "f1",
      ],
      spacing: [
        "gutter", "tap",
        "section-input", "section-page", "section-tab", "section-auth", "section-end",
      ],
      container: ["content", "auth-form", "auth-text"],
    },
  },
});

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
