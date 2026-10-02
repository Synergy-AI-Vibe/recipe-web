import "server-only";

export const jsonResponse = (body: unknown, status = 200, headers: Record<string, string> = {}): Response =>
  Response.json(body, { status, headers });

export const logServerError = (scope: string, error: unknown): void => {
  console.error(scope, error instanceof Error ? error.message : String(error));
};
