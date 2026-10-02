import { formatWon } from "@/lib/calc";
import type { CompareBarProps } from "@/components/result/compare-bar.types";

const ROW = "flex flex-wrap items-center gap-4 border-b border-line py-4";
const LABEL = "w-24 flex-none text-s1";
const TRACK = "flex h-3.5 min-w-30 flex-1 bg-canvas";
const VALUE = "w-24 flex-none text-right text-b2-bar";

export const CompareBar = ({ eatOutAverage, ingredientTotal, fillPercent }: CompareBarProps) => (
  <div className="border-t border-line-strong">
    <div className={ROW}>
      <span className={LABEL}>사 먹으면</span>
      <span aria-hidden className={TRACK}>
        <span className="block h-full w-full bg-text" />
      </span>
      <span className={VALUE}>{formatWon(eatOutAverage)}원</span>
    </div>
    <div className={ROW}>
      <span className={LABEL}>해 먹으면</span>
      <span aria-hidden className={TRACK}>
        <span className="block h-full bg-accent" style={{ width: `${fillPercent}%` }} />
      </span>
      <span className={`${VALUE} text-accent`}>{formatWon(ingredientTotal)}원</span>
    </div>
  </div>
);
