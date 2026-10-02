import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export const getAuthenticatedUser = async (supabase: SupabaseClient): Promise<User | null> => {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
};
