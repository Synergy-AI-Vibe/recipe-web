import { useQuery } from "@tanstack/react-query";
import { type Session } from "@recipe-web/api";
import { getSupabaseClient } from "@/lib/supabase/client";

export const sessionQueryKey = ["auth", "me"] as const;

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
