import type { Meta, StoryObj } from "@storybook/react-vite";
import { TextLink } from "./text-link";

const meta: Meta<typeof TextLink> = {
  title: "Components/TextLink",
  component: TextLink,
};

export default meta;

type Story = StoryObj<typeof TextLink>;

/** 올려 보고(빨강), 눌러 보고, Tab으로 이동해 보세요. */
export const Default: Story = {
  render: () => <TextLink href="#">← 돌아가기</TextLink>,
};

/** apps/web에서는 `as={Link}`로 next/link를 주입합니다. 여기서는 button으로 대신 보여 줍니다. */
export const AsButton: Story = {
  render: () => (
    <TextLink as="button" type="button">
      링크로 계산하기
    </TextLink>
  ),
};
