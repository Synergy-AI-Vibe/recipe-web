import { createApiClient } from "@recipe-web/api";

let browserClient: ReturnType<typeof createApiClient> | undefined;

export const getApiClient = () => {
  const baseURL = "/api";

  // Do not share an instance across server requests.
  if (typeof window === "undefined") {
    return createApiClient({ baseURL, withCredentials: true });
  }

  browserClient ??= createApiClient({ baseURL, withCredentials: true });
  return browserClient;
};
