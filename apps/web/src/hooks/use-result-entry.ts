import { useEffect, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isYoutubeUrl } from "@/lib/is-youtube-url";
import { useAnalyzeByUrl } from "@/queries/analyze";
import { useResultStore } from "@/store/result-store";
import type { ResultEntry } from "@/types/result";

const subscribeHydration = (listener: () => void) =>
  useResultStore.persist.onFinishHydration(listener);

const getHydrated = () =>
  useResultStore.persist.hasHydrated() || !useResultStore.persist.getOptions().storage;

const getServerHydrated = () => false;

export const useResultEntry = (): ResultEntry => {
  const router = useRouter();
  const urlParam = useSearchParams().get("url")?.trim() || null;
  const hydrated = useSyncExternalStore(subscribeHydration, getHydrated, getServerHydrated);
  const source = useResultStore((state) => state.source);
  const data = useResultStore((state) => state.data);

  useEffect(() => {
    void useResultStore.persist.rehydrate();
  }, []);

  const storedMatches =
    data !== null && (urlParam === null || (source?.type === "youtube" && source.url === urlParam));
  const isValidUrl = urlParam !== null && isYoutubeUrl(urlParam);

  const analysis = useAnalyzeByUrl(urlParam, hydrated && !storedMatches && isValidUrl);
  const analyzed = analysis.data;

  useEffect(() => {
    if (urlParam !== null && analyzed?.status === "success") {
      useResultStore.getState().open({ type: "youtube", url: urlParam }, analyzed.data);
    }
  }, [analyzed, urlParam]);

  useEffect(() => {
    if (hydrated && !storedMatches && urlParam === null) router.replace("/");
  }, [hydrated, storedMatches, urlParam, router]);

  if (!hydrated) return { kind: "loading" };
  if (storedMatches && data) return { kind: "ready", data };
  if (urlParam === null) return { kind: "loading" };
  if (!isValidUrl || analysis.isError || (analyzed && analyzed.status !== "success")) {
    return { kind: "failed" };
  }
  return { kind: "loading" };
};
