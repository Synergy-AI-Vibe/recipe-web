import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { anonymousSession, deleteAccount, type Session } from "@recipe-web/api";
import { getApiClient } from "@/lib/api-client";
import { getSupabaseClient } from "@/lib/supabase/client";

export const sessionQueryKey = ["auth", "me"] as const;

const clearSessionCache = (queryClient: QueryClient) => {
  queryClient.clear();
  queryClient.setQueryData(sessionQueryKey, anonymousSession);
};

export const useSession = () =>
  useQuery({
    queryKey: sessionQueryKey,
    queryFn: async (): Promise<Session> => {
      const { data, error } = await getSupabaseClient().auth.getUser();
      if (error && error.name !== "AuthSessionMissingError") throw error;
      if (!data.user) return { authenticated: false, user: null };
      const metadata = data.user.user_metadata;
      const nickname = metadata?.nickname;
      const name = metadata?.name;
      return {
        authenticated: true,
        user: {
          id: data.user.id,
          name: typeof nickname === "string" ? nickname : typeof name === "string" ? name : "회원",
        },
      };
    },
    meta: { errorMode: "local" },
  });

export const useLogout = (callbacks: { onSuccess: () => void; onError: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await getSupabaseClient().auth.signOut();
      if (error) throw error;
    },
    meta: { errorMode: "local" },
    onSuccess: () => {
      clearSessionCache(queryClient);
      callbacks.onSuccess();
    },
    onError: callbacks.onError,
  });
};

export const useWithdraw = (onSuccess: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await deleteAccount(getApiClient());
      await getSupabaseClient().auth.signOut({ scope: "local" }).catch(() => undefined);
    },
    meta: { errorMode: "local" },
    onSuccess: () => {
      clearSessionCache(queryClient);
      onSuccess();
    },
  });
};
