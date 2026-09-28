import type { Meta, StoryObj } from "@storybook/react-vite";

// 11_디자인시스템 6항 — 고정·겹침 요소는 이 셋뿐입니다.
const usages = [
  { name: "결과 탭바 (sticky)", value: "z-4" },
  { name: "계정 드롭다운 (absolute)", value: "z-10" },
  { name: "토스트 (fixed)", value: "z-30" },
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
