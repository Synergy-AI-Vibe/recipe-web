import axios, { type AxiosInstance } from "axios";
import { normalizeApiError } from "../errors/normalize-api-error";

export interface ApiClientOptions {
  baseURL: string;
  timeout?: number;
  withCredentials?: boolean;
}

export const createApiClient = ({
  baseURL,
  timeout = 10_000,
  withCredentials = false,
}: ApiClientOptions): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout,
    withCredentials,
  });

  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      throw normalizeApiError(error);
    },
  );

  return client;
};
