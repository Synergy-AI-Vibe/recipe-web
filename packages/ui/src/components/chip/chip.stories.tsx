import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Chip } from "./chip";
import { ChipAddInput } from "./chip-add-input";

const meta: Meta<typeof Chip> = {
  title: "Components/Chip",
  component: Chip,
};

export default meta;

type Story = StoryObj<typeof Chip>;

export const Variants: Story = {
  name: "고른 재료 / 눌러서 담기",
  render: () => (
    <dl className="grid grid-cols-[120px_1fr] items-center gap-3 text-b4">
      <dt className="text-text-2">고른 재료</dt>
      <dd className="flex flex-wrap gap-2">
        <Chip variant="selected" label="돼지고기" onRemove={() => undefined} />
        <Chip variant="selected" label="신김치" onRemove={() => undefined} />
      </dd>
      <dt className="text-text-2">눌러서 담기</dt>
      <dd className="flex flex-wrap gap-2">
        <Chip variant="addable" label="두부" onAdd={() => undefined} />
        <Chip variant="addable" label="계란" onAdd={() => undefined} />
      </dd>
      <dt className="text-text-2">비활성</dt>
      <dd className="flex flex-wrap gap-2">
        <Chip variant="addable" label="대파" disabled onAdd={() => undefined} />
      </dd>
    </dl>
  ),
};

const MAX_COUNT = 5;

const PickerDemo = () => {
  const [chosen, setChosen] = useState<string[]>(["돼지고기"]);
  const isFull = chosen.length >= MAX_COUNT;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ChipAddInput
        label="가진 재료 직접 입력"
        maxLength={10}
        placeholder={isFull ? "5개를 모두 골랐습니다" : "재료 입력 후 Enter"}
        disabled={isFull}
        onAdd={(value) => setChosen((current) => [...current, value])}
      />
      {chosen.map((item) => (
        <Chip
          key={item}
          variant="selected"
          label={item}
          onRemove={() => setChosen((current) => current.filter((value) => value !== item))}
        />
      ))}
    </div>
  );
};

export const AddInput: Story = {
  name: "직접 입력 (최대 5개)",
  render: () => <PickerDemo />,
};
