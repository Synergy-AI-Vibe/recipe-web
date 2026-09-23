import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Foundations/Opacity",
};

export default meta;

type Story = StoryObj;

// 별도 opacity 토큰이 없습니다 — 반투명이 필요한 곳(모달 뒷배경 등)은
// 전용 색상 토큰(--color-scrim: rgba(17,17,17,0.44))에 알파값을 내장해서 씁니다.
export const Opacity: Story = {
  name: "No opacity scale (baked into color: scrim)",
  render: () => (
    <>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
        별도 opacity 스케일 토큰은 정의되어 있지 않습니다. 반투명이 필요한 유일한 곳(모달
        배경)은 alpha값이 내장된 <code>--color-scrim</code> 색상 토큰을 그대로 씁니다.
      </p>
      <div
        style={{
          position: "relative",
          width: 200,
          height: 100,
          background:
            "repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 50% / 16px 16px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--color-scrim)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 12,
            fontFamily: "monospace",
          }}
        >
          --color-scrim
        </div>
      </div>
    </>
  ),
};
