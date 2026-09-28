import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "./skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "Components/Skeleton",
  component: Skeleton,
};

export default meta;

type Story = StoryObj<typeof Skeleton>;

export const Block: Story = {
  render: () => <Skeleton className="h-10 w-60" />,
};

/** 행 모양 조합은 각 화면에서 만듭니다. 예: 북마크 목록 행 4개 */
export const ListRows: Story = {
  render: () => (
    <ul aria-busy className="max-w-content border-t border-line-strong">
      {Array.from({ length: 4 }, (_, index) => (
        <li key={index} className="flex items-center gap-4 border-b border-line py-4">
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-4 w-24" />
        </li>
      ))}
    </ul>
  ),
};
