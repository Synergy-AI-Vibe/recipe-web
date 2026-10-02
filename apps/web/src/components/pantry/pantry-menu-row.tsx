import { ListRow, Tag } from "@recipe-web/ui";
import { getCostLabel, getMenuMeta } from "@/lib/pantry";
import type { PantryMenuRowProps } from "@/components/pantry/pantry-menu-row.types";

export const PantryMenuRow = ({ menu }: PantryMenuRowProps) => {
  const missingCount = menu.extraIngredients.length;
  const cost = getCostLabel(menu);

  return (
    <ListRow
      title={
        <>
          {menu.name}
          {missingCount === 0 ? (
            <Tag tone="inverse" className="ml-2 align-middle">
              지금 바로 가능
            </Tag>
          ) : (
            <Tag className="ml-2 py-0.75 align-middle">부족 {missingCount}개</Tag>
          )}
        </>
      }
      meta={getMenuMeta(menu)}
      trailingWidth={104}
      trailing={
        <>
          <b className="block text-b2 text-text">{cost.primary}</b>
          {cost.secondary && <span className="mt-1 block text-c2 text-accent">{cost.secondary}</span>}
        </>
      }
    />
  );
};
