import type { AnalyzeData, Bookmark, CreateBookmarkRequest, CreateBookmarkResponse } from "@recipe-web/api";
import type { ResultSource } from "@/types/result";

const normalizeText = (text: string) => text.trim();

export const buildBookmarkInput = (source: ResultSource, data: AnalyzeData): CreateBookmarkRequest =>
  source.type === "youtube"
    ? {
        sourceType: "youtube",
        sourceUrl: source.url,
        title: data.recipe.title,
        servings: data.recipe.servings,
      }
    : {
        sourceType: "manual",
        rawText: normalizeText(source.text),
        title: data.recipe.title,
        servings: data.recipe.servings,
      };

export const findSavedBookmark = (items: Bookmark[], source: ResultSource | null): Bookmark | null => {
  if (!source) return null;
  if (source.type === "youtube") {
    return items.find((item) => item.sourceType === "youtube" && item.sourceUrl === source.url) ?? null;
  }
  const text = normalizeText(source.text);
  return (
    items.find(
      (item) => item.sourceType === "manual" && item.rawText !== null && normalizeText(item.rawText) === text,
    ) ?? null
  );
};

export type BookmarkOpenTarget =
  | { kind: "link"; href: string }
  | { kind: "text"; text: string }
  | { kind: "unavailable" };

export const getBookmarkOpenTarget = (item: Bookmark): BookmarkOpenTarget => {
  if (item.sourceType === "youtube" && item.sourceUrl !== null) {
    return { kind: "link", href: `/result?url=${encodeURIComponent(item.sourceUrl)}` };
  }
  const text = item.rawText?.trim();
  return item.sourceType === "manual" && text ? { kind: "text", text } : { kind: "unavailable" };
};

export type CreateOutcome = "saved" | "login" | "limit" | "ignored";

export const getCreateOutcome = (response: CreateBookmarkResponse): CreateOutcome => {
  if (response.ok) return "saved";
  if (response.reason === "unauthorized") return "login";
  if (response.reason === "limit") return "limit";
  return "ignored";
};
