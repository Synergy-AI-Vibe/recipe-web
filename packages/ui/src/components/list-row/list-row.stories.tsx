import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Tag } from "../tag/tag";
import { List, ListRow } from "./list-row";

const meta: Meta<typeof ListRow> = {
  title: "Components/ListRow",
  component: ListRow,
};

export default meta;

type Story = StoryObj<typeof ListRow>;

const Price = ({ amount, sub }: { amount: string; sub: string }) => (
  <>
    <b className="block text-b2 leading-[1.3]">{amount}</b>
    <span className="block text-c2 text-text-2">{sub}</span>
  </>
);

const initialBookmarks = [
  {
    id: 1,
    title: "돼지고기 김치찌개",
    meta: "유튜브 · 자취요리연구소 · 2인분",
    amount: "12,850원",
    sub: "1인분 6,425원",
  },
  {
    id: 2,
    title: "간장 계란밥",
    meta: "유튜브 · 혼밥연구소 · 1인분",
    amount: "800원",
    sub: "1인분 800원",
  },
];

const BookmarksDemo = () => {
  const [items, setItems] = useState(initialBookmarks);
  const [opened, setOpened] = useState<string>();

  return (
    <div className="max-w-content">
      <List>
        {items.map((item) => (
          <ListRow
            key={item.id}
            title={item.title}
            meta={item.meta}
            trailing={<Price amount={item.amount} sub={item.sub} />}
            onOpen={() => setOpened(item.title)}
            onRemove={() => setItems((prev) => prev.filter(({ id }) => id !== item.id))}
            removeLabel={`${item.title} 삭제`}
          />
        ))}
      </List>
      <p className="mt-3 text-c1 text-text-2">열린 행: {opened ?? "없음"}</p>
    </div>
  );
};

/** 행을 누르면 열리고, ×를 누르면 그 행만 지워집니다(행 열기가 함께 실행되지 않음). */
export const Bookmarks: Story = {
  name: "북마크",
  render: () => <BookmarksDemo />,
};

export const Recommendations: Story = {
  name: "추천 결과",
  render: () => (
    <List className="max-w-content">
      <ListRow
        title={
          <>
            김치볶음밥 <Tag tone="inverse">지금 바로 가능</Tag>
          </>
        }
        meta="가진 재료 5개로 전부 됩니다"
        trailing={<Price amount="추가 0원" sub="7,053원 절약" />}
        trailingWidth={104}
        href="#"
      />
      <ListRow
        title={
          <>
            계란말이 <Tag className="py-0.75">부족 1개</Tag>
          </>
        }
        meta="사야 할 재료 당근"
        trailing={<Price amount="추가 460원" sub="5,890원 절약" />}
        trailingWidth={104}
        href="#"
      />
    </List>
  ),
};
