import type { ServerApiClient } from "$lib/api/client";
import type { Session } from "$lib/auth/session";

declare global {
  namespace App {
    interface Locals {
      api: ServerApiClient;
      session: Session;
      requestId: string;
    }
  }
}

export {};
