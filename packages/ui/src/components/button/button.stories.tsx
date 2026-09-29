import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "./button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  args: { children: "이 레시피로 계산" },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "accent", "ghost", "kakao"] },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

/** 올려 보고, 눌러 보고, Tab으로 이동해 보세요. */
export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex max-w-content flex-col gap-4">
      <div className="flex flex-wrap gap-2.5">
        <Button>이 레시피로 계산</Button>
        <Button variant="accent">원가 계산</Button>
        <Button variant="ghost">다른 링크 넣기</Button>
        <Button variant="ghost" className="text-text">
          취소
        </Button>
      </div>
      <div className="max-w-auth-form">
        <Button variant="kakao">카카오로 3초 만에 시작하기</Button>
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2.5">
      <Button disabled>이 레시피로 계산</Button>
      <Button variant="accent" disabled>
        원가 계산
      </Button>
      <Button variant="ghost" disabled>
        다른 링크 넣기
      </Button>
    </div>
  ),
};

const LoadingDemo = () => {
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Button loading={loading}>이 레시피로 계산</Button>
      <Button variant="accent" loading={loading}>
        원가 계산
      </Button>
      <Button variant="ghost" onClick={() => setLoading((prev) => !prev)}>
        로딩 {loading ? "끄기" : "켜기"}
      </Button>
    </div>
  );
};

/** 라벨만 바뀌고 폭은 그대로입니다. 스피너가 없습니다. */
export const Loading: Story = {
  render: () => <LoadingDemo />,
};
