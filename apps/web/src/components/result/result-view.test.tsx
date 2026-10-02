import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BookmarkButton, PriceInput } from "@recipe-web/ui";
import { sampleAnalyzeData } from "@/lib/fixtures/analyze-data";
import { ResultView } from "@/components/result/result-view";

const renderView = () =>
  renderToStaticMarkup(
    <ResultView
      data={sampleAnalyzeData}
      adjustments={{}}
      onToggleIngredient={() => undefined}
      onPriceChange={() => undefined}
    />,
  );

describe("ResultView 접근성", () => {
  it("제목은 h1 하나이고 탭 목록에 이름이 있다", () => {
    const html = renderView();

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain('role="tablist" aria-label="결과 보기"');
  });

  it("선택된 탭 패널은 탭과 이어지고 키보드로 접근할 수 있다", () => {
    const html = renderView();

    expect(html).toContain('role="tabpanel"');
    expect(html).toContain('aria-labelledby="result-tab-savings"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('id="result-panel-savings"');
  });

  it("선택된 탭만 키보드 이동 대상이다", () => {
    const html = renderView();

    expect(html.match(/role="tab"[^>]*tabindex="0"/g)).toHaveLength(1);
    expect(html.match(/role="tab"[^>]*tabindex="-1"/g)).toHaveLength(2);
  });
});

describe("BookmarkButton", () => {
  it("라벨이 상태를 알려 주므로 눌림 속성을 쓰지 않는다", () => {
    expect(renderToStaticMarkup(<BookmarkButton active />)).not.toContain("aria-pressed");
  });

  it("요청 중에는 비활성이 되고 진행 중임을 알리며 요청 중 라벨이 보인다", () => {
    const saving = renderToStaticMarkup(<BookmarkButton active={false} loading />);
    const removing = renderToStaticMarkup(<BookmarkButton active loading />);

    expect(saving).toContain("disabled");
    expect(saving).toContain('aria-busy="true"');
    expect(saving).toContain("저장 중");
    expect(removing).toContain("해제 중");
  });

  it("보이는 라벨은 하나뿐이고 나머지는 숨겨 폭만 차지한다", () => {
    const html = renderToStaticMarkup(<BookmarkButton active={false} />);

    expect(html.match(/invisible/g)).toHaveLength(2);
  });
});

describe("PriceInput", () => {
  it("라벨 안에 입력칸이 있어 칸 어디를 눌러도 입력되고, 입력칸에는 이름이 있다", () => {
    const html = renderToStaticMarkup(<PriceInput label="사골육수 팩 금액 직접 입력" value={0} onValueChange={() => undefined} />);

    expect(html).toMatch(/^<label[^>]*min-h-tap/);
    expect(html).toContain('aria-label="사골육수 팩 금액 직접 입력"');
    expect(html).toContain('inputMode="numeric"');
  });
});
