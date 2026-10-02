import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyAdjustments } from "@/lib/adjust-ingredients";
import { sampleAnalyzeData } from "@/lib/fixtures/analyze-data";
import type { ResultSource } from "@/types/result";

const youtubeSource: ResultSource = { type: "youtube", url: "https://youtu.be/sample0001" };
const KEY = "recipe-web:result";

const createFakeStorage = () => {
  const items = new Map<string, string>();
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
  };
};

const loadStore = async () => {
  vi.resetModules();
  return (await import("@/store/result-store")).useResultStore;
};

let storage: ReturnType<typeof createFakeStorage>;

beforeEach(() => {
  storage = createFakeStorage();
  vi.stubGlobal("sessionStorage", storage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("result store", () => {
  it("새 결과를 열면 이전 조정값을 지운다", async () => {
    const store = await loadStore();
    store.getState().open(youtubeSource, sampleAnalyzeData);
    store.getState().toggleIngredient(1);
    expect(store.getState().adjustments).not.toEqual({});

    store.getState().open(youtubeSource, sampleAnalyzeData);

    expect(store.getState().adjustments).toEqual({});
    expect(store.getState().data).toEqual(sampleAnalyzeData);
  });

  it("체크를 두 번 누르면 원래 상태로 돌아온다", async () => {
    const store = await loadStore();
    store.getState().open(youtubeSource, sampleAnalyzeData);

    store.getState().toggleIngredient(1);
    expect(applyAdjustments(sampleAnalyzeData.ingredients, store.getState().adjustments)[0].checked).toBe(false);
    store.getState().toggleIngredient(1);
    expect(applyAdjustments(sampleAnalyzeData.ingredients, store.getState().adjustments)[0].checked).toBe(true);
  });

  it("직접 입력한 금액을 해당 재료에만 적용한다", async () => {
    const store = await loadStore();
    store.getState().open(youtubeSource, sampleAnalyzeData);

    store.getState().setUserPrice(2, 1500);
    const rows = applyAdjustments(sampleAnalyzeData.ingredients, store.getState().adjustments);

    expect(rows.find((row) => row.id === 2)?.userPrice).toBe(1500);
    expect(rows.find((row) => row.id === 1)?.userPrice).toBeNull();
  });

  it("없는 재료는 조정하지 않는다", async () => {
    const store = await loadStore();
    store.getState().open(youtubeSource, sampleAnalyzeData);

    store.getState().toggleIngredient(999);
    store.getState().setUserPrice(999, 100);

    expect(store.getState().adjustments).toEqual({});
  });

  it("결과를 비우면 모두 초기 상태가 된다", async () => {
    const store = await loadStore();
    store.getState().open(youtubeSource, sampleAnalyzeData);

    store.getState().clear();

    expect(store.getState()).toMatchObject({ source: null, data: null, adjustments: {} });
  });
});

describe("result store 보관", () => {
  it("결과와 조정값을 sessionStorage에 저장하고 새로고침 후 다시 불러온다", async () => {
    const first = await loadStore();
    first.getState().open(youtubeSource, sampleAnalyzeData);
    first.getState().toggleIngredient(1);
    first.getState().setUserPrice(2, 1500);
    expect(storage.items.has(KEY)).toBe(true);

    const second = await loadStore();
    expect(second.getState().data).toBeNull();
    await second.persist.rehydrate();

    expect(second.getState().source).toEqual(youtubeSource);
    expect(second.getState().data).toEqual(sampleAnalyzeData);
    expect(second.getState().adjustments).toEqual({
      1: { checked: false },
      2: { userPrice: 1500 },
    });
  });

  it("직접 입력 원문도 함께 보관한다", async () => {
    const first = await loadStore();
    first.getState().open({ type: "text", text: "두부 1모" }, sampleAnalyzeData);

    const second = await loadStore();
    await second.persist.rehydrate();

    expect(second.getState().source).toEqual({ type: "text", text: "두부 1모" });
  });

  it("저장된 값이 지금 응답 형식과 맞지 않으면 버리고 빈 상태로 시작한다", async () => {
    storage.setItem(
      KEY,
      JSON.stringify({
        state: { source: youtubeSource, data: { recipe: { title: "예전 형식" } }, adjustments: {} },
        version: 1,
      }),
    );

    const store = await loadStore();
    await store.persist.rehydrate();

    expect(store.getState()).toMatchObject({ source: null, data: null, adjustments: {} });
  });

  it("출처 형식이 잘못된 값도 버린다", async () => {
    storage.setItem(
      KEY,
      JSON.stringify({ state: { source: { type: "unknown" }, data: sampleAnalyzeData, adjustments: {} }, version: 1 }),
    );

    const store = await loadStore();
    await store.persist.rehydrate();

    expect(store.getState().data).toBeNull();
  });
});
