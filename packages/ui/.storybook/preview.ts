import type { Preview } from "@storybook/react-vite";
// 웹 앱은 next/font로 글꼴을 불러오므로, 글꼴 파일은 Storybook에서만 fontsource로 불러옵니다
import "@fontsource/noto-sans-kr/400.css";
import "@fontsource/noto-sans-kr/500.css";
import "@fontsource/noto-sans-kr/700.css";
import "@fontsource/noto-sans-kr/900.css";
import "../src/styles/theme.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
