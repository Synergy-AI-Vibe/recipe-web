import "server-only";
import type { StorePrice } from "@recipe-web/api";
import { logServerError } from "@/server/api-response";
import { getAdminSupabaseClient } from "@/server/supabase/admin";

type StorePriceRow = {
  menu_name: string;
  price_min: number | null;
  price_max: number | null;
  price_avg: number | null;
  delivery_fee: number;
  sample_size: number;
  surveyed_on: string | null;
};

export const matchStorePrice = async (recipeTitle: string): Promise<StorePrice | null> => {
  try {
    const { data, error } = await getAdminSupabaseClient().rpc("match_store_price", {
      recipe_title: recipeTitle,
    });
    if (error) {
      logServerError("[matchStorePrice]", error.message);
      return null;
    }

    const row = (Array.isArray(data) ? data[0] : data) as StorePriceRow | null | undefined;
    if (!row || row.price_avg === null) return null;

    return {
      menuName: row.menu_name,
      min: row.price_min ?? row.price_avg,
      max: row.price_max ?? row.price_avg,
      avg: row.price_avg,
      deliveryFee: row.delivery_fee,
      sampleSize: row.sample_size,
      surveyedOn: row.surveyed_on ?? "",
    };
  } catch (error) {
    logServerError("[matchStorePrice]", error);
    return null;
  }
};
