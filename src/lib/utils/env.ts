import { env as publicEnv } from "$env/dynamic/public";
import { env as privateEnv } from "$env/dynamic/private";

export const API_BASE_URL =
  privateEnv.PRIVATE_API_BASE_URL || publicEnv.PUBLIC_API_BASE_URL || "http://localhost:3000";
export const API_VERSION =
  privateEnv.PRIVATE_API_VERSION || publicEnv.PUBLIC_API_VERSION || "/api/v2";
