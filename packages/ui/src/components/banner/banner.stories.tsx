import type { Meta, StoryObj } from "@storybook/react-vite";
import { Banner } from "./banner";

const meta: Meta<typeof Banner> = {
  title: "Components/Banner",
  component: Banner,
};

export default meta;

type Story = StoryObj<typeof Banner>;

export const MissingPrice: Story = {
  name: "가격 없는 재료",
  render: () => (
    <Banner className="max-w-content">
      <b>사골육수 팩</b>은 가격 데이터가 없습니다. 아래에서 금액을 넣으면 합계에 바로 반영됩니다.
    </Banner>
  ),
};

export const BookmarkFull: Story = {
  name: "북마크 가득",
  render: () => (
    <Banner className="max-w-content">
      북마크가 5개로 가득 찼습니다. 새로 저장하려면 아래에서 먼저 지워 주세요.
    </Banner>
  ),
};
