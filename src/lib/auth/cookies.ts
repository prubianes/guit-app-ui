import type { Cookies } from "@sveltejs/kit";

export const ACCESS_COOKIE = "finance_access_token";
export const REFRESH_COOKIE = "finance_refresh_token";

const defaultCookieOptions = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production"
};

export const setAuthCookies = (
  cookies: Cookies,
  input: { accessToken: string; refreshToken?: string }
) => {
  cookies.set(ACCESS_COOKIE, input.accessToken, {
    ...defaultCookieOptions,
    maxAge: 60 * 15
  });

  if (input.refreshToken) {
    cookies.set(REFRESH_COOKIE, input.refreshToken, {
      ...defaultCookieOptions,
      maxAge: 60 * 60 * 24 * 30
    });
  }
};

export const clearAuthCookies = (cookies: Cookies) => {
  cookies.delete(ACCESS_COOKIE, { path: "/" });
  cookies.delete(REFRESH_COOKIE, { path: "/" });
};

export const getTokensFromCookies = (cookies: Cookies) => ({
  accessToken: cookies.get(ACCESS_COOKIE) ?? null,
  refreshToken: cookies.get(REFRESH_COOKIE) ?? null
});
