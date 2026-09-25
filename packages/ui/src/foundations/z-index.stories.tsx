import type { Meta, StoryObj } from "@storybook/react-vite";

const usages = [
  { name: "Modal", value: "z-20" },
  { name: "Toast", value: "z-30" },
];

const meta: Meta = {
  title: "Foundations/Z-Index",
};

export default meta;

type Story = StoryObj;

// 이름 붙은 z-index 토큰이 없습니다. Tailwind 기본 스케일의 raw 값을 그대로 씁니다.
export const ZIndex: Story = {
  name: "No named scale (raw Tailwind values)",
  render: () => (
    <>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
        이름 붙은 z-index 토큰은 없습니다. 컴포넌트에서 Tailwind 기본 스케일 값을 그대로 씁니다.
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <tbody>
          {usages.map((u) => (
            <tr key={u.name} style={{ borderTop: "1px solid #eee" }}>
              <td style={{ padding: 8, width: 160 }}>{u.name}</td>
              <td style={{ padding: 8, fontFamily: "monospace" }}>{u.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  ),
};
