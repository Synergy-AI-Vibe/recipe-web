import { z } from "zod";

export const sessionSchema = z.discriminatedUnion("authenticated", [
  z.object({ authenticated: z.literal(false), user: z.null() }),
  z.object({
    authenticated: z.literal(true),
    user: z.object({ id: z.string(), name: z.string() }),
  }),
]);

export type Session = z.infer<typeof sessionSchema>;

export const anonymousSession: Session = { authenticated: false, user: null };
