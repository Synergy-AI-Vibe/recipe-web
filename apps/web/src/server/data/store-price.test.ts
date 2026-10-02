import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { matchStorePrice } from "@/server/data/store-price";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), getAdminSupabaseClient: vi.fn() }));

vi.mock("@/server/supabase/admin", () => ({ getAdminSupabaseClient: mocks.getAdminSupabaseClient }));

const row = {
  menu_name: "김치찌개",
  price_min: 16000,
  price_max: 22000,
  price_avg: 19000,
  delivery_fee: 3000,
  sample_size: 12,
  surveyed_on: "2026-09-01",
};

beforeEach(() => {
  mocks.getAdminSupabaseClient.mockReturnValue({ rpc: mocks.rpc });
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("matchStorePrice", () => {
  it("레시피 제목으로 DB 함수를 부르고 화면 형식으로 바꾼다", async () => {
    mocks.rpc.mockResolvedValue({ data: [row], error: null });

    await expect(matchStorePrice("돼지고기 김치찌개")).resolves.toEqual({
      menuName: "김치찌개",
      min: 16000,
      max: 22000,
      avg: 19000,
      deliveryFee: 3000,
      sampleSize: 12,
      surveyedOn: "2026-09-01",
    });
    expect(mocks.rpc).toHaveBeenCalledWith("match_store_price", { recipe_title: "돼지고기 김치찌개" });
  });

  it("함수가 행 하나를 그대로 돌려줘도 읽는다", async () => {
    mocks.rpc.mockResolvedValue({ data: row, error: null });

    await expect(matchStorePrice("김치찌개")).resolves.toMatchObject({ avg: 19000 });
  });

  it("최소·최대가 없으면 평균으로 채우고 조사일이 없으면 빈 문자열이다", async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ ...row, price_min: null, price_max: null, surveyed_on: null }],
      error: null,
    });

    await expect(matchStorePrice("김치찌개")).resolves.toMatchObject({ min: 19000, max: 19000, surveyedOn: "" });
  });

  it.each([
    ["결과 없음", { data: [], error: null }],
    ["데이터 없음", { data: null, error: null }],
    ["평균 가격 없음", { data: [{ ...row, price_avg: null }], error: null }],
  ])("%s이면 null이다", async (_name, result) => {
    mocks.rpc.mockResolvedValue(result);

    await expect(matchStorePrice("김치찌개")).resolves.toBeNull();
  });

  it("DB 오류는 분석을 막지 않고 null로 돌려준다", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "function does not exist" } });

    await expect(matchStorePrice("김치찌개")).resolves.toBeNull();
  });

  it("관리자 클라이언트를 만들 수 없어도 null로 돌려준다", async () => {
    mocks.getAdminSupabaseClient.mockImplementation(() => {
      throw new Error("서버 환경 변수 SUPABASE_SECRET_KEY가 필요합니다.");
    });

    await expect(matchStorePrice("김치찌개")).resolves.toBeNull();
  });
});
