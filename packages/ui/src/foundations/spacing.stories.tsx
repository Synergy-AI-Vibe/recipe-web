import type { Meta, StoryObj } from "@storybook/react-vite";
import { FoundationTable, type Token } from "./foundation-table";

// 범용 스페이싱 스케일은 없고, 이름 붙은 토큰은 이 두 개뿐입니다.
const tokens: Token[] = [
  { name: "spacing-gutter", variable: "--spacing-gutter" },
  { name: "spacing-tap", variable: "--spacing-tap" },
];

const layoutTokens: Token[] = [{ name: "container-content", variable: "--container-content" }];

const meta: Meta = {
  title: "Foundations/Spacing",
};

export default meta;

type Story = StoryObj;

export const Spacing: Story = {
  render: () => (
    <>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
        패딩/마진용 범용 스페이싱 스케일은 정의되어 있지 않습니다. 이름 붙은 토큰은 탭 최소
        터치영역(tap)과 반응형 좌우 여백(gutter) 두 가지뿐입니다.
      </p>
      <FoundationTable
        tokens={tokens}
        renderPreview={(_token, value) => (
          <div style={{ height: 16, width: value, maxWidth: 200, background: "var(--color-accent)" }} />
        )}
      />
    </>
  ),
};

export const Layout: Story = {
  render: () => (
    <FoundationTable
      tokens={layoutTokens}
      renderPreview={(_token, value) => (
        <span style={{ fontFamily: "monospace" }}>max-width: {value}</span>
      )}
    />
  ),
};
