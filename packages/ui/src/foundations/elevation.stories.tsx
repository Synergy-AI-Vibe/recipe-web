import type { Meta, StoryObj } from "@storybook/react-vite";
import { FoundationTable, type Token } from "./foundation-table";

// 정의된 그림자는 토스트용 한 개뿐입니다 (모달은 그림자 없이 테두리+스크림으로 구분).
const tokens: Token[] = [{ name: "shadow-toast", variable: "--shadow-toast" }];

const meta: Meta = {
  title: "Foundations/Elevation",
};

export default meta;

type Story = StoryObj;

export const Elevation: Story = {
  name: "shadow-toast only",
  render: () => (
    <div style={{ background: "var(--color-canvas)", padding: 16 }}>
      <FoundationTable
        tokens={tokens}
        renderPreview={(_token, value) => (
          <div
            style={{
              width: 96,
              height: 40,
              background: "var(--color-text)",
              color: "var(--color-on-ink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              boxShadow: value,
            }}
          >
            Toast
          </div>
        )}
      />
    </div>
  ),
};
