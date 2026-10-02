import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { getTabPanelProps, TabBar } from "./tab-bar";
import type { TabItem } from "./tab-bar.types";

const meta: Meta<typeof TabBar> = {
  title: "Components/TabBar",
  component: TabBar,
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<typeof TabBar>;

const resultTabs: TabItem[] = [
  { key: "savings", label: "절약 금액", meta: "10,700원" },
  { key: "ingredients", label: "재료별 금액", meta: "5개" },
  { key: "steps", label: "조리법" },
];

const TabsDemo = ({ tabs }: { tabs: TabItem[] }) => {
  const [activeKey, setActiveKey] = useState(tabs[0].key);
  return (
    <>
      <TabBar idPrefix="demo" label="예시 탭" tabs={tabs} activeKey={activeKey} onChange={setActiveKey} />
      {tabs.map(
        (tab) =>
          tab.key === activeKey && (
            <section key={tab.key} className="container py-8 text-b1" {...getTabPanelProps("demo", tab.key)}>
              {tab.label} 내용이 여기에 옵니다. 화살표 키로 탭을 옮겨 보세요.
            </section>
          ),
      )}
    </>
  );
};

export const Result: Story = {
  name: "결과 화면 (메타 포함)",
  render: () => <TabsDemo tabs={resultTabs} />,
};

export const WithoutMeta: Story = {
  name: "메타 없음",
  render: () => (
    <TabsDemo
      tabs={[
        { key: "a", label: "첫째" },
        { key: "b", label: "둘째" },
      ]}
    />
  ),
};
