import type { Meta, StoryObj } from "@storybook/react-vite";
import { FoundationTable, type Token } from "./foundation-table";

const fontTokens: Token[] = [{ name: "font-sans", variable: "--font-sans" }];

const weights = [
  { label: "400 · Regular", weight: 400 },
  { label: "500 · Medium", weight: 500 },
  { label: "700 · Bold", weight: 700 },
  { label: "900 · Black", weight: 900 },
];

// 실제 코드(Button, Chip, Modal, Toast 등)에서 관찰된 값 — 별도로 정의된 스케일은 없음.
const observedSizes = [
  { label: "13px (Chip)", size: "13px" },
  { label: "13.5px (Button sm / Toast)", size: "13.5px" },
  { label: "text-sm (14px, Button md)", size: "14px" },
  { label: "clamp(19px, 2.4vw, 22px) (Modal 제목)", size: "clamp(19px, 2.4vw, 22px)" },
];

const meta: Meta = {
  title: "Foundations/Typography",
};

export default meta;

type Story = StoryObj;

export const FontFamily: Story = {
  render: () => (
    <FoundationTable
      tokens={fontTokens}
      renderPreview={() => (
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "1rem" }}>
          Noto Sans KR 가나다라 Ag
        </span>
      )}
    />
  ),
};

export const Weights: Story = {
  render: () => (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
      <tbody>
        {weights.map((w) => (
          <tr key={w.weight} style={{ borderTop: "1px solid #eee" }}>
            <td style={{ padding: 8, width: 160, fontFamily: "monospace" }}>{w.label}</td>
            <td style={{ padding: 8, fontFamily: "var(--font-sans)", fontWeight: w.weight }}>
              Noto Sans KR 가나다라 Ag
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};

export const ObservedSizes: Story = {
  name: "Observed sizes (no fixed scale)",
  render: () => (
    <>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
        고정된 폰트 크기 스케일 토큰은 없습니다. 컴포넌트마다 필요에 맞춰 임의값을 씁니다.
        아래는 실제 코드에서 관찰된 값입니다.
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <tbody>
          {observedSizes.map((s) => (
            <tr key={s.label} style={{ borderTop: "1px solid #eee" }}>
              <td style={{ padding: 8, width: 260, fontFamily: "monospace" }}>{s.label}</td>
              <td style={{ padding: 8, fontFamily: "var(--font-sans)", fontSize: s.size }}>
                Noto Sans KR 가나다라
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  ),
};
