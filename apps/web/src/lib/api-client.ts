import { createApiClient } from "@recipe-web/api";

let browserClient: ReturnType<typeof createApiClient> | undefined;

export const getApiClient = () => {
  const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseURL?.trim()) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL must be configured before using the API.",
    );
  }

  // Do not share an instance across server requests when auth is connected later.
  if (typeof window === "undefined") {
    return createApiClient({ baseURL });
  }

  browserClient ??= createApiClient({ baseURL });
  return browserClient;
};
