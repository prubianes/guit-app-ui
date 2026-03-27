import { describe, expect, it, vi, afterEach } from "vitest";
import { log } from "$lib/utils/logger";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("logger redaction", () => {
  it("redacts sensitive keys regardless of key casing", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    log("error", "redaction.check", {
      Authorization: "Bearer abc123",
      accessToken: "token-1",
      REFRESH_TOKEN: "token-2",
      password: "secret"
    });

    expect(spy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(spy.mock.calls[0][0] as string) as Record<string, string>;
    expect(payload.Authorization).toBe("***redacted***");
    expect(payload.accessToken).toBe("***redacted***");
    expect(payload.REFRESH_TOKEN).toBe("***redacted***");
    expect(payload.password).toBe("***redacted***");
  });

  it("redacts nested sensitive keys", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});

    log("info", "redaction.nested", {
      request: {
        headers: {
          Cookie: "session=abc",
          "set-cookie": "refresh=xyz"
        }
      }
    });

    const payload = JSON.parse(spy.mock.calls[0][0] as string) as {
      request: { headers: { Cookie: string; "set-cookie": string } };
    };
    expect(payload.request.headers.Cookie).toBe("***redacted***");
    expect(payload.request.headers["set-cookie"]).toBe("***redacted***");
  });
});
