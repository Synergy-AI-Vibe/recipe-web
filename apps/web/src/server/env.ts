import "server-only";

export const SERVER_ENV_KEYS = [
  "SUPABASE_SECRET_KEY",
  "GEMINI_API_KEY",
  "YOUTUBE_API_KEY",
  "KAMIS_CERT_KEY",
  "KAMIS_CERT_ID",
  "PRICE_GO_SERVICE_KEY",
] as const;

export type ServerEnvKey = (typeof SERVER_ENV_KEYS)[number];

export const getServerEnv = (key: ServerEnvKey): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

export const requireServerEnv = (key: ServerEnvKey): string => {
  const value = getServerEnv(key);
  if (!value) throw new Error(`서버 환경 변수 ${key}가 필요합니다.`);
  return value;
};
