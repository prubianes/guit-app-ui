import { z } from "zod";
import type { ApiErrorPayload } from "$lib/api/types";
import { ApiClientError } from "$lib/api/errors";

const idSchema = z.union([z.string(), z.number()]);
const dateStringSchema = z.string().min(1);

const apiErrorItemSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional()
});

export const apiErrorSchema = z.object({
  error: apiErrorItemSchema
});

export const userSchema = z
  .object({
    id: idSchema,
    email: z.string().email().or(z.string().min(1)),
    firstName: z.string().optional(),
    first_name: z.string().optional(),
    lastName: z.string().optional(),
    last_name: z.string().optional(),
    createdAt: z.string().optional(),
    created_at: z.string().optional()
  })
  .transform((user) => ({
    id: String(user.id),
    email: user.email,
    firstName: user.firstName ?? user.first_name,
    lastName: user.lastName ?? user.last_name,
    createdAt: user.createdAt ?? user.created_at
  }));

export const accountSchema = z
  .object({
    id: idSchema,
    name: z.string().min(1).optional(),
    accountName: z.string().min(1).optional(),
    account_name: z.string().min(1).optional(),
    type: z.string().min(1).optional(),
    accountType: z.string().min(1).optional(),
    account_type: z.string().min(1).optional(),
    currency: z.string().min(1).optional(),
    currencyCode: z.string().min(1).optional(),
    currency_code: z.string().min(1).optional(),
    balance: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
    institution: z.string().nullable().optional(),
    institutionName: z.string().nullable().optional(),
    institution_name: z.string().nullable().optional(),
    createdAt: z.string().optional(),
    created_at: z.string().optional(),
    updatedAt: z.string().optional(),
    updated_at: z.string().optional()
  })
  .transform((account) => ({
    id: String(account.id),
    name: account.name ?? account.accountName ?? account.account_name ?? "Untitled account",
    type: account.type ?? account.accountType ?? account.account_type ?? "other",
    currency: (account.currency ?? account.currencyCode ?? account.currency_code ?? "USD").toUpperCase(),
    balance: Number.isFinite(Number(account.balance)) ? Number(account.balance) : 0,
    institution: account.institution ?? account.institutionName ?? account.institution_name ?? undefined,
    createdAt: account.createdAt ?? account.created_at,
    updatedAt: account.updatedAt ?? account.updated_at
  }));

export const accountListSchema = z
  .union([
    z.array(accountSchema),
    z.object({ accounts: z.array(accountSchema) }),
    z.object({ items: z.array(accountSchema) }),
    z.object({ rows: z.array(accountSchema) })
  ])
  .transform((value) => {
    if (Array.isArray(value)) return value;
    if ("accounts" in value) return value.accounts;
    if ("items" in value) return value.items;
    return value.rows;
  });

export const categorySchema = z
  .object({
    id: idSchema,
    name: z.string().min(1),
    color: z.string().optional(),
    kind: z.enum(["income", "expense"]).optional(),
    type: z.enum(["income", "expense"]).optional(),
    createdAt: z.string().optional(),
    created_at: z.string().optional(),
    updatedAt: z.string().optional(),
    updated_at: z.string().optional()
  })
  .transform((category) => ({
    id: String(category.id),
    name: category.name,
    color: category.color,
    kind: category.kind ?? category.type,
    createdAt: category.createdAt ?? category.created_at,
    updatedAt: category.updatedAt ?? category.updated_at
  }));

export const transactionSchema = z
  .object({
    id: idSchema,
    accountId: idSchema.or(z.coerce.number()),
    account_id: idSchema.or(z.coerce.number()).optional(),
    categoryId: idSchema.or(z.coerce.number()),
    category_id: idSchema.or(z.coerce.number()).optional(),
    amount: z.coerce.number(),
    type: z.enum(["income", "expense"]),
    description: z.string().optional(),
    occurredAt: dateStringSchema.optional(),
    occurred_at: dateStringSchema.optional(),
    date: dateStringSchema.optional(),
    createdAt: z.string().optional(),
    created_at: z.string().optional(),
    updatedAt: z.string().optional(),
    updated_at: z.string().optional()
  })
  .transform((transaction) => ({
    id: String(transaction.id),
    accountId: transaction.accountId ?? transaction.account_id ?? "",
    categoryId: transaction.categoryId ?? transaction.category_id ?? "",
    amount: transaction.amount,
    type: transaction.type,
    description: transaction.description,
    occurredAt: transaction.occurredAt ?? transaction.occurred_at ?? transaction.date,
    date: transaction.date ?? transaction.occurredAt ?? transaction.occurred_at,
    createdAt: transaction.createdAt ?? transaction.created_at,
    updatedAt: transaction.updatedAt ?? transaction.updated_at
  }));

export const budgetSchema = z
  .object({
    id: idSchema,
    categoryId: idSchema,
    category_id: idSchema.optional(),
    amount: z.coerce.number(),
    period: z.enum(["monthly", "weekly", "yearly"]),
    startDate: z.string().optional(),
    start_date: z.string().optional(),
    endDate: z.string().optional(),
    end_date: z.string().optional(),
    createdAt: z.string().optional(),
    created_at: z.string().optional(),
    updatedAt: z.string().optional(),
    updated_at: z.string().optional()
  })
  .transform((budget) => ({
    id: String(budget.id),
    categoryId: String(budget.categoryId ?? budget.category_id ?? ""),
    amount: budget.amount,
    period: budget.period,
    startDate: budget.startDate ?? budget.start_date,
    endDate: budget.endDate ?? budget.end_date,
    createdAt: budget.createdAt ?? budget.created_at,
    updatedAt: budget.updatedAt ?? budget.updated_at
  }));

const authResponseSchema = z.object({
  accessToken: z.string().optional(),
  access_token: z.string().optional(),
  token: z.string().optional(),
  jwt: z.string().optional(),
  refreshToken: z.string().optional(),
  refresh_token: z.string().optional(),
  tokens: z
    .object({
      accessToken: z.string().optional(),
      access_token: z.string().optional(),
      refreshToken: z.string().optional(),
      refresh_token: z.string().optional()
    })
    .optional(),
  user: z.unknown().optional(),
  me: z.unknown().optional()
});

export const authPayloadSchema = authResponseSchema.refine(
  (payload) =>
    Boolean(
      payload.accessToken ||
        payload.access_token ||
        payload.token ||
        payload.jwt ||
        payload.tokens?.accessToken ||
        payload.tokens?.access_token
    ),
  "Missing access token in auth response"
);

export const successEnvelopeSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    data: schema
  });

export const parseErrorEnvelope = (payload: unknown, status: number): ApiErrorPayload => {
  const parsed = apiErrorSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      error: {
        code: "UNKNOWN_ERROR",
        message: "Unknown server error."
      }
    };
  }
  return parsed.data;
};

export const parseSuccessData = <T>(
  schema: z.ZodSchema<T>,
  payload: unknown,
  status: number,
  endpoint: string
): T => {
  const envelopeSchema = successEnvelopeSchema(schema);
  const parsedEnvelope = envelopeSchema.safeParse(payload);
  if (!parsedEnvelope.success) {
    throw new ApiClientError({
      code: "INVALID_RESPONSE_SCHEMA",
      message: `Invalid success response schema for ${endpoint}.`,
      status,
      details: parsedEnvelope.error.flatten()
    });
  }
  return parsedEnvelope.data.data as T;
};
