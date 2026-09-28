import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tag } from "./tag";

const meta: Meta<typeof Tag> = {
  title: "Components/Tag",
  component: Tag,
};

export default meta;

type Story = StoryObj<typeof Tag>;

export const Tones: Story = {
  render: () => (
    <dl className="grid grid-cols-[80px_1fr] items-center gap-3 text-b4">
      <dt className="text-text-2">출처</dt>
      <dd className="flex gap-1.5">
        <Tag>참가격</Tag>
        <Tag>KAMIS</Tag>
        <Tag>오픈마켓</Tag>
      </dd>
      <dt className="text-text-2">주의</dt>
      <dd className="flex gap-1.5">
        <Tag tone="caution">금액 없음</Tag>
        <Tag tone="caution">직접 입력</Tag>
      </dd>
      <dt className="text-text-2">추천 결과</dt>
      <dd className="flex gap-1.5">
        <Tag tone="inverse">지금 바로 가능</Tag>
        <Tag className="py-0.75">부족 2개</Tag>
      </dd>
    </dl>
  ),
};
