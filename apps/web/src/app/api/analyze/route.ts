import { ANALYZE_TEXT_MAX_LENGTH, type AnalyzeResponse } from "@recipe-web/api";
import { isYoutubeUrl } from "@/lib/is-youtube-url";
import { jsonResponse, logServerError } from "@/server/api-response";
import { toAnalyzeResponse } from "@/server/adapters/analyze";
import { analyze } from "@/server/recipe/analyze.js";

export const runtime = "nodejs";
export const maxDuration = 60;

const failure = (code: string, message: string): AnalyzeResponse => ({ status: "error", code, message });

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return jsonResponse(failure("INVALID_INPUT", "요청을 읽지 못했어요."), 400);
  }

  const { url: rawUrl, text: rawText } = body as { url?: unknown; text?: unknown };
  const url = typeof rawUrl === "string" ? rawUrl.trim() : "";
  const text = typeof rawText === "string" ? rawText.trim() : "";

  if (!url && !text) {
    return jsonResponse(failure("INVALID_URL", "유튜브 주소나 레시피를 입력해 주세요."), 400);
  }
  if (url && !isYoutubeUrl(url)) {
    return jsonResponse(failure("INVALID_URL", "유튜브 주소 형식이 아니에요."), 400);
  }
  if (!url && text.length > ANALYZE_TEXT_MAX_LENGTH) {
    return jsonResponse(
      failure("INVALID_INPUT", `레시피는 ${ANALYZE_TEXT_MAX_LENGTH.toLocaleString("ko-KR")}자까지 넣을 수 있어요.`),
      400,
    );
  }

  try {
    const result = await analyze(url ? { url } : { text });
    return jsonResponse(await toAnalyzeResponse(result, { url: url || undefined, text: text || undefined }));
  } catch (error) {
    logServerError("[POST /api/analyze]", error);
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode === 400) {
      return jsonResponse(failure("INVALID_URL", (error as Error).message), 400);
    }
    return jsonResponse(failure("INTERNAL", "계산에 실패했어요. 잠시 후 다시 시도해 주세요."), 500);
  }
}
