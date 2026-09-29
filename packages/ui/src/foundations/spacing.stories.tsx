import type { Meta, StoryObj } from "@storybook/react-vite";
import { FoundationTable, type Token } from "./foundation-table";

const tokens: Token[] = [
  { name: "spacing-gutter", variable: "--spacing-gutter" },
  { name: "spacing-tap", variable: "--spacing-tap" },
];

// 11_디자인시스템 3-2항 — 섹션 세로 패딩
const sectionTokens: Token[] = [
  { name: "spacing-section-input (입력부 위)", variable: "--spacing-section-input" },
  { name: "spacing-section-page (북마크 · 재료로 찾기 위)", variable: "--spacing-section-page" },
  { name: "spacing-section-tab (탭 내용 위)", variable: "--spacing-section-tab" },
  { name: "spacing-section-auth (로그인 · 탈퇴 위)", variable: "--spacing-section-auth" },
  { name: "spacing-section-end (화면 끝)", variable: "--spacing-section-end" },
];

// 11_디자인시스템 3-2항 — 이 값만 씁니다. 목록에 없는 중간값(5px, 24px 등)은 쓰지 않습니다.
const allowedGaps = [
  { usage: "붙은 요소 사이", values: [4, 6, 7, 8] },
  { usage: "요소 사이", values: [10, 12, 14, 16, 18] },
  { usage: "묶음 사이", values: [20, 22, 26, 28] },
  { usage: "블록 사이", values: [30, 34] },
  { usage: "세로 패딩(행)", values: [15, 16, 18, 20] },
];

const layoutTokens: Token[] = [
  { name: "container-content", variable: "--container-content" },
  { name: "container-auth-form (로그인 폼)", variable: "--container-auth-form" },
  { name: "container-auth-text (탈퇴 확인 문단)", variable: "--container-auth-text" },
];

const meta: Meta = {
  title: "Foundations/Spacing",
};

export default meta;

type Story = StoryObj;

export const Spacing: Story = {
  render: () => (
    <>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
        이름 붙은 토큰은 최소 터치영역(tap)과 반응형 좌우 여백(gutter)입니다. 그 밖의 간격은
        Tailwind 기본 스케일(4px 단위, 예: p-3.75 = 15px)로 쓰되 AllowedGaps의 값만 씁니다.
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

export const AllowedGaps: Story = {
  name: "Allowed gaps",
  render: () => (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
      <tbody>
        {allowedGaps.map((g) => (
          <tr key={g.usage} style={{ borderTop: "1px solid #eee" }}>
            <td style={{ padding: 8, width: 160 }}>{g.usage}</td>
            <td style={{ padding: 8 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
                {g.values.map((v) => (
                  <div key={v} style={{ textAlign: "center", fontFamily: "monospace", fontSize: 12 }}>
                    <div style={{ width: v, height: v, background: "var(--color-accent)", margin: "0 auto 4px" }} />
                    {v}
                  </div>
                ))}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};

export const SectionPadding: Story = {
  name: "Section padding",
  render: () => (
    <FoundationTable
      tokens={sectionTokens}
      renderPreview={(_token, value) => (
        <div style={{ height: value, width: 16, background: "var(--color-accent)" }} />
      )}
    />
  ),
};
