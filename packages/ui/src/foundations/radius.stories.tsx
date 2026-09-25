import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Foundations/Radius",
};

export default meta;

type Story = StoryObj;

// 반경 스케일이 없습니다 — "반경 0이 원칙"으로, 모든 요소에 border-radius: 0이 전역 적용됩니다.
export const Radius: Story = {
  name: "0 everywhere (no scale)",
  render: () => (
    <>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
        반경 스케일은 존재하지 않습니다. <code>*, *::before, *::after {"{"} border-radius: 0 {"}"}</code>{" "}
        가 전역으로 적용되어 있고, 이는 예외 없는 디자인 원칙입니다.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <div
          style={{
            width: 64,
            height: 40,
            background: "var(--color-text)",
            borderRadius: 0,
          }}
        />
        <div
          style={{
            width: 64,
            height: 40,
            border: "1px solid var(--color-line-strong)",
            borderRadius: 0,
          }}
        />
      </div>
    </>
  ),
};
