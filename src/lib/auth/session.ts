import type { User } from "$lib/api/types";

export type Session = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
};

export const isAuthenticated = (session: Session) =>
  Boolean(session.accessToken || session.refreshToken);
