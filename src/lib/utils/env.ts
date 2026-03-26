import { env as publicEnv } from "$env/dynamic/public";
import { env as privateEnv } from "$env/dynamic/private";

const normalizeApiVersion = (value: string) => {
  const trimmed = value.trim();
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

const rawBaseUrl = privateEnv.PRIVATE_API_BASE_URL || publicEnv.PUBLIC_API_BASE_URL;
const rawVersion = privateEnv.PRIVATE_API_VERSION || publicEnv.PUBLIC_API_VERSION;

const isProduction = privateEnv.NODE_ENV === "production";
if (isProduction) {
  if (!rawBaseUrl) {
    throw new Error(
      "Missing API base URL in production. Set PRIVATE_API_BASE_URL or PUBLIC_API_BASE_URL."
    );
  }
  if (!rawVersion) {
    throw new Error(
      "Missing API version in production. Set PRIVATE_API_VERSION or PUBLIC_API_VERSION."
    );
  }
}

export const API_BASE_URL = (rawBaseUrl || "http://localhost:3000").replace(/\/+$/, "");
export const API_VERSION = normalizeApiVersion(rawVersion || "/api/v2");
