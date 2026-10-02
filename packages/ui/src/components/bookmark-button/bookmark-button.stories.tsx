import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { BookmarkButton } from "./bookmark-button";

const meta: Meta<typeof BookmarkButton> = {
  title: "Components/BookmarkButton",
  component: BookmarkButton,
};

export default meta;

type Story = StoryObj<typeof BookmarkButton>;

const REQUEST_DELAY_MS = 1200;

const Toggle = () => {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => {
      setActive((current) => !current);
      setLoading(false);
    }, REQUEST_DELAY_MS);
  };

  return <BookmarkButton active={active} loading={loading} onClick={handleClick} />;
};

export const Interactive: Story = {
  name: "눌러서 바꾸기 (요청 중 포함)",
  render: () => <Toggle />,
};

export const States: Story = {
  name: "상태",
  render: () => (
    <dl className="grid grid-cols-[120px_1fr] items-center gap-3 text-b4">
      <dt className="text-text-2">북마크 전</dt>
      <dd>
        <BookmarkButton active={false} />
      </dd>
      <dt className="text-text-2">북마크 됨</dt>
      <dd>
        <BookmarkButton active />
      </dd>
      <dt className="text-text-2">저장 요청 중</dt>
      <dd>
        <BookmarkButton active={false} loading />
      </dd>
      <dt className="text-text-2">해제 요청 중</dt>
      <dd>
        <BookmarkButton active loading />
      </dd>
      <dt className="text-text-2">비활성 (북마크 전)</dt>
      <dd>
        <BookmarkButton active={false} disabled />
      </dd>
      <dt className="text-text-2">비활성 (북마크 됨)</dt>
      <dd>
        <BookmarkButton active disabled />
      </dd>
    </dl>
  ),
};
