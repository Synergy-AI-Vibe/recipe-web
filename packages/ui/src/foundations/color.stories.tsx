import type { Meta, StoryObj } from "@storybook/react-vite";
import { FoundationTable, type Token } from "./foundation-table";

const textTokens: Token[] = [
  { name: "text", variable: "--color-text" },
  { name: "text-2", variable: "--color-text-2" },
  { name: "text-3", variable: "--color-text-3" },
  { name: "text-4", variable: "--color-text-4" },
  { name: "on-ink", variable: "--color-on-ink" },
];

const surfaceTokens: Token[] = [
  { name: "surface", variable: "--color-surface" },
  { name: "canvas", variable: "--color-canvas" },
  { name: "line", variable: "--color-line" },
  { name: "line-2", variable: "--color-line-2" },
  { name: "line-strong", variable: "--color-line-strong" },
];

const accentTokens: Token[] = [
  { name: "accent", variable: "--color-accent" },
  { name: "accent-hover", variable: "--color-accent-hover" },
  { name: "accent-press", variable: "--color-accent-press" },
  { name: "accent-soft", variable: "--color-accent-soft" },
  { name: "accent-strong", variable: "--color-accent-strong" },
  { name: "ink-hover", variable: "--color-ink-hover" },
  { name: "ink-press", variable: "--color-ink-press" },
];

const etcTokens: Token[] = [
  { name: "disabled", variable: "--color-disabled" },
  { name: "chip-mark", variable: "--color-chip-mark" },
  { name: "kakao", variable: "--color-kakao" },
  { name: "kakao-hover", variable: "--color-kakao-hover" },
  { name: "kakao-press", variable: "--color-kakao-press" },
  { name: "focus", variable: "--color-focus" },
  { name: "scrim", variable: "--color-scrim" },
];

const swatch = (_token: Token, value: string) => (
  <div
    style={{
      width: 48,
      height: 24,
      border: "1px solid #ddd",
      background: value,
    }}
  />
);

const meta: Meta = {
  title: "Foundations/Color",
};

export default meta;

type Story = StoryObj;

export const Text: Story = {
  render: () => <FoundationTable tokens={textTokens} renderPreview={swatch} />,
};

export const SurfaceAndLine: Story = {
  render: () => <FoundationTable tokens={surfaceTokens} renderPreview={swatch} />,
};

export const Accent: Story = {
  render: () => <FoundationTable tokens={accentTokens} renderPreview={swatch} />,
};

export const Etc: Story = {
  render: () => <FoundationTable tokens={etcTokens} renderPreview={swatch} />,
};
