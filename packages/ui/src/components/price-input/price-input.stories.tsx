import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { PriceInput } from "./price-input";

const meta: Meta<typeof PriceInput> = {
  title: "Components/PriceInput",
  component: PriceInput,
};

export default meta;

type Story = StoryObj<typeof PriceInput>;

const PriceInputDemo = ({ initial }: { initial: number }) => {
  const [value, setValue] = useState(initial);
  return (
    <div className="flex flex-col items-start gap-3">
      <PriceInput label="사골육수 팩 금액 직접 입력" value={value} onValueChange={setValue} />
      <p className="text-c1 text-text-2">현재 값: {value}</p>
    </div>
  );
};

export const Empty: Story = {
  name: "빈 칸",
  render: () => <PriceInputDemo initial={0} />,
};

export const Filled: Story = {
  name: "입력됨",
  render: () => <PriceInputDemo initial={3500} />,
};
