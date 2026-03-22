import type {
  AuthResult,
  CreateCategoryInput,
  CreateTransactionInput,
  UpdateCategoryInput,
  UpdateTransactionInput
} from "$lib/api/types";
import { ApiClientError } from "$lib/api/errors";
import { authPayloadSchema, userSchema } from "$lib/api/contracts";

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

export const toIsoDatetime = (value: unknown) => {
  const raw = asString(value);
  if (!raw) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw}T00:00:00.000Z`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toISOString();
};

export const adaptCategoryInput = (input: CreateCategoryInput | UpdateCategoryInput) => {
  const normalizedType = input.kind ?? "expense";
  return {
    name: input.name,
    color: input.color ?? "#64748b",
    type: normalizedType,
    kind: normalizedType
  };
};

export const adaptTransactionInput = (input: CreateTransactionInput | UpdateTransactionInput) => {
  const normalizedDate = toIsoDatetime(input.date ?? input.occurredAt);
  return {
    accountId: input.accountId !== undefined ? Number(input.accountId) : undefined,
    categoryId: input.categoryId !== undefined ? Number(input.categoryId) : undefined,
    amount: input.amount,
    type: input.type,
    description: input.description,
    date: normalizedDate,
    occurredAt: normalizedDate
  };
};

const extractTokenPair = (data: Record<string, unknown>) => {
  const tokens = asRecord(data.tokens);

  const accessToken =
    asString(data.accessToken) ??
    asString(data.access_token) ??
    asString(data.token) ??
    asString(data.jwt) ??
    asString(tokens.accessToken) ??
    asString(tokens.access_token) ??
    "";

  const refreshToken =
    asString(data.refreshToken) ??
    asString(data.refresh_token) ??
    asString(tokens.refreshToken) ??
    asString(tokens.refresh_token);

  return { accessToken, refreshToken };
};

export const normalizeAuthResult = (payload: unknown): AuthResult => {
  const parsedPayload = authPayloadSchema.safeParse(payload);
  if (!parsedPayload.success) {
    throw new ApiClientError({
      code: "INVALID_AUTH_RESPONSE",
      message: "Login succeeded but response shape is invalid.",
      status: 500,
      details: parsedPayload.error.flatten()
    });
  }

  const data = parsedPayload.data;
  const { accessToken, refreshToken } = extractTokenPair(data as Record<string, unknown>);
  const rawUser = asRecord((data as Record<string, unknown>).user ?? (data as Record<string, unknown>).me);
  const parsedUser = userSchema.safeParse(rawUser);

  if (!accessToken) {
    throw new ApiClientError({
      code: "INVALID_AUTH_RESPONSE",
      message: "Login succeeded but no access token was returned.",
      status: 500,
      details: payload
    });
  }

  return {
    accessToken,
    refreshToken,
    user: parsedUser.success
      ? parsedUser.data
      : {
          id: "",
          email: ""
        }
  };
};
