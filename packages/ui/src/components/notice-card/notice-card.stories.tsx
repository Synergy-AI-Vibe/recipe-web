import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button";
import { NoticeCard } from "./notice-card";

const meta: Meta<typeof NoticeCard> = {
  title: "Components/NoticeCard",
  component: NoticeCard,
};

export default meta;

type Story = StoryObj<typeof NoticeCard>;

/** 실패 카드 안의 버튼은 13.5px입니다(다른 곳은 14px). */
export const Alert: Story = {
  name: "실패형",
  render: () => (
    <NoticeCard
      className="max-w-content"
      eyebrow="추출 실패"
      title="설명란에서 재료를 찾지 못했어요"
      description="이 영상은 설명란에 재료 목록이 없습니다. 재료를 직접 적어 주시면 같은 방식으로 계산해 드립니다."
      actions={
        <>
          <Button className="text-[13.5px]">이 레시피로 계산</Button>
          <Button variant="ghost" className="text-[13.5px]">
            다른 링크 넣기
          </Button>
        </>
      }
    />
  ),
};

export const Quiet: Story = {
  name: "조용한 형",
  render: () => (
    <NoticeCard variant="quiet" className="max-w-content">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-b1b">김치찌개 2인</span>
        <span className="text-b2">18,000 ~ 24,000원</span>
      </div>
    </NoticeCard>
  ),
};
