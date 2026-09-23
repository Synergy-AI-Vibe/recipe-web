import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Foundations/Motion",
};

export default meta;

type Story = StoryObj;

// 정의된 모션은 --animate-fade-in(120ms ease-out) 하나뿐입니다 (모달 진입에 사용).
export const FadeIn: Story = {
  name: "animate-fade-in (only defined motion)",
  render: () => {
    const [key, setKey] = useState(0);

    return (
      <div>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
          <code>--animate-fade-in: fade-in 120ms ease-out;</code> — 모달이 열릴 때만 쓰이는
          유일한 모션 토큰입니다. 버튼을 눌러 다시 재생해보세요.
        </p>
        <button
          type="button"
          onClick={() => setKey((k) => k + 1)}
          style={{
            marginBottom: 12,
            padding: "8px 16px",
            background: "var(--color-text)",
            color: "var(--color-on-ink)",
            border: "none",
          }}
        >
          다시 재생
        </button>
        <div
          key={key}
          className="animate-fade-in"
          style={{
            width: 160,
            height: 60,
            background: "var(--color-accent)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
          }}
        >
          fade-in
        </div>
      </div>
    );
  },
};
