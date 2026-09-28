import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button";
import { showToast, ToastViewport } from "./toast";

const meta: Meta<typeof ToastViewport> = {
  title: "Components/Toast",
  component: ToastViewport,
};

export default meta;

type Story = StoryObj<typeof ToastViewport>;

const messages = ["카카오 계정으로 로그인했습니다.", "로그아웃되었습니다.", "탈퇴가 완료되었습니다."];

/** 2.6초 뒤 사라집니다. 연달아 누르면 쌓이지 않고 문구만 바뀝니다. */
export const Default: Story = {
  render: () => (
    <>
      <div className="flex flex-wrap gap-2.5">
        {messages.map((message) => (
          <Button key={message} variant="ghost" onClick={() => showToast(message)}>
            {message}
          </Button>
        ))}
      </div>
      <ToastViewport />
    </>
  ),
};
