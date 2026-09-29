import type { Meta, StoryObj } from "@storybook/react-vite";
import { FoundationTable, type Token } from "./foundation-table";

const fontTokens: Token[] = [{ name: "font-sans", variable: "--font-sans" }];

const weights = [
  { label: "400 · Regular", weight: 400 },
  { label: "500 · Medium", weight: 500 },
  { label: "700 · Bold", weight: 700 },
  { label: "900 · Black", weight: 900 },
];

// 11_디자인시스템 2-1항. 클래스는 `text-<단계>` (예: text-h4) — 크기·행간·자간·굵기가 함께 적용됩니다.
const scale = [
  { step: "d1", className: "text-d1", usage: "절약 금액", sample: "9,146" },
  { step: "d2", className: "text-d2", usage: "D1 옆의 “원”", sample: "원" },
  { step: "d3", className: "text-d3", usage: "D1 옆의 “아낍니다”", sample: "아낍니다" },
  { step: "h1", className: "text-h1", usage: "홈 첫 문장", sample: "레시피 하나면 얼마 아끼는지 나옵니다" },
  { step: "h2", className: "text-h2", usage: "결과 화면 요리 이름", sample: "돼지고기 김치찌개" },
  { step: "h3", className: "text-h3", usage: "북마크 · 재료로 찾기 · 로그인 · 탈퇴", sample: "북마크" },
  { step: "h4", className: "text-h4", usage: "추출 실패 · 결과 없음 카드 제목", sample: "설명란에서 재료를 찾지 못했어요" },
  { step: "h5", className: "text-h5", usage: "섹션 제목", sample: "재료별 금액" },
  { step: "h6", className: "text-h6", usage: "재료비 합계 금액", sample: "12,854원" },
  { step: "s1", className: "text-s1", usage: "소제목", sample: "사 먹으면 기준이 된 가격" },
  { step: "s2", className: "text-s2", usage: "목록의 레시피 이름", sample: "돼지고기 김치찌개" },
  { step: "b1", className: "text-b1", usage: "본문", sample: "유튜브 영상 설명란에서 재료를 읽습니다." },
  { step: "b1b", className: "text-b1b", usage: "강조 본문 · 재료명 · 탭 라벨 · 버튼", sample: "돼지고기 목살" },
  { step: "b2", className: "text-b2", usage: "재료·목록 행 금액", sample: "4,740원" },
  { step: "b2-bar", className: "text-b2-bar", usage: "비교 막대 금액", sample: "22,000원" },
  { step: "b3", className: "text-b3", usage: "카드 안 설명문 · 로그인 안내", sample: "재료를 직접 적어 주시면 같은 방식으로 계산해 드립니다." },
  { step: "b4", className: "text-b4", usage: "화면 상단 안내문", sample: "저장한 레시피는 열 때마다 그날 가격으로 다시 계산합니다." },
  { step: "n1", className: "text-n1", usage: "헤더 내비 (굵기는 700 / 500 별도 지정)", sample: "재료로 찾기" },
  { step: "c1", className: "text-c1", usage: "표 아래 주석 · 갱신일", sample: "2026.09.01 기준" },
  { step: "c2", className: "text-c2", usage: "재료 행의 규격·환산", sample: "냉장 목살 500g 팩 · 7,900원" },
  { step: "l1", className: "text-l1", usage: "라벨", sample: "유튜브 · 자취요리연구소" },
  { step: "l1-strong", className: "text-l1-strong", usage: "라벨 강조", sample: "추출 실패" },
  { step: "l2", className: "text-l2", usage: "태그", sample: "참가격" },
  { step: "f1", className: "text-f1", usage: "푸터 고지", sample: "가격은 KAMIS · 참가격 공공 API 기준입니다." },
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

export const Scale: Story = {
  render: () => (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", padding: 8 }}>Class</th>
          <th style={{ textAlign: "left", padding: 8 }}>Usage</th>
          <th style={{ textAlign: "left", padding: 8 }}>Preview</th>
        </tr>
      </thead>
      <tbody>
        {scale.map((s) => (
          <tr key={s.step} style={{ borderTop: "1px solid #eee" }}>
            <td style={{ padding: 8, width: 120, fontFamily: "monospace" }}>text-{s.step}</td>
            <td style={{ padding: 8, width: 240, color: "#666" }}>{s.usage}</td>
            <td style={{ padding: 8 }}>
              <span className={s.className}>{s.sample}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
