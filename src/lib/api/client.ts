import type { RequestEvent } from "@sveltejs/kit";
import {
  type Account,
  type ApiErrorPayload,
  type ApiResponse,
  type AuthResult,
  type Budget,
  type Category,
  type CreateAccountInput,
  type CreateBudgetInput,
  type CreateCategoryInput,
  type CreateTransactionInput,
  type Transaction,
  type UpdateAccountInput,
  type UpdateBudgetInput,
  type UpdateCategoryInput,
  type UpdateTransactionInput,
  type User
} from "$lib/api/types";
import { ApiClientError } from "$lib/api/errors";
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from "$lib/auth/cookies";
import { API_BASE_URL, API_VERSION } from "$lib/utils/env";

type RequestOptions = {
  auth?: boolean;
  retryOn401?: boolean;
};

export class ServerApiClient {
  private event: RequestEvent;
  private baseUrl: string;
  private version: string;

  constructor(event: RequestEvent) {
    this.event = event;
    this.baseUrl = API_BASE_URL;
    this.version = API_VERSION;
  }

  private resolvePath(path: string) {
    const normalizedVersion = this.version.startsWith("/") ? this.version : `/${this.version}`;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${this.baseUrl}${normalizedVersion}${normalizedPath}`;
  }

  private get accessToken() {
    return this.event.cookies.get("finance_access_token") ?? null;
  }

  private get refreshToken() {
    return this.event.cookies.get("finance_refresh_token") ?? null;
  }

  private async parseJson<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      return (await response.json()) as ApiResponse<T>;
    } catch {
      throw new ApiClientError({
        code: "INVALID_RESPONSE",
        message: "Server returned an invalid response.",
        status: response.status
      });
    }
  }

  private async refreshTokens() {
    const refreshToken = this.refreshToken;
    if (!refreshToken) return false;

    const response = await this.event.fetch(this.resolvePath("/auth/refresh"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${REFRESH_COOKIE}=${refreshToken}`
      }
    });

    const payload = await this.parseJson<Record<string, unknown>>(response);

    if (!response.ok || "error" in payload) {
      clearAuthCookies(this.event.cookies);
      return false;
    }

    const data = payload.data as Record<string, unknown>;
    const { accessToken, refreshToken: nextRefresh } = extractTokenPair(data);

    if (!accessToken) {
      clearAuthCookies(this.event.cookies);
      return false;
    }

    setAuthCookies(this.event.cookies, {
      accessToken,
      refreshToken: nextRefresh ?? refreshToken
    });

    return true;
  }

  private async request<T>(
    path: string,
    init?: RequestInit,
    options: RequestOptions = { auth: false, retryOn401: true }
  ): Promise<T> {
    const headers = new Headers(init?.headers || {});
    headers.set("Content-Type", "application/json");

    if (options.auth && this.accessToken) {
      headers.set("Authorization", `Bearer ${this.accessToken}`);
    }

    const response = await this.event.fetch(this.resolvePath(path), {
      ...init,
      headers
    });

    if (response.status === 401 && options.auth && options.retryOn401) {
      const refreshed = await this.refreshTokens();
      if (refreshed) {
        return this.request<T>(path, init, { ...options, retryOn401: false });
      }
      throw new ApiClientError({
        code: "UNAUTHORIZED",
        message: "Session expired.",
        status: 401
      });
    }

    const payload = await this.parseJson<T>(response);

    if (!response.ok || "error" in payload) {
      const err = (payload as ApiErrorPayload).error;
      const code = err?.code ?? "UNKNOWN_ERROR";
      const shouldAttemptRefresh =
        options.auth &&
        options.retryOn401 &&
        (response.status === 401 || code === "UNAUTHORIZED" || code === "INVALID_TOKEN");

      if (shouldAttemptRefresh) {
        const refreshed = await this.refreshTokens();
        if (refreshed) {
          return this.request<T>(path, init, { ...options, retryOn401: false });
        }

        throw new ApiClientError({
          code: "UNAUTHORIZED",
          message: "Session expired.",
          status: 401
        });
      }

      throw new ApiClientError({
        code,
        message: err?.message ?? "Unknown server error.",
        details: err?.details,
        status: response.status
      });
    }

    return payload.data;
  }

  authRegister(input: {
    email: string;
    password: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  }) {
    return this.request<Record<string, unknown>>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input)
    }).then(normalizeAuthResult);
  }

  authLogin(input: { email: string; password: string }) {
    return this.request<Record<string, unknown>>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input)
    }).then(normalizeAuthResult);
  }

  authMe() {
    return this.request<User>("/me", undefined, { auth: true });
  }

  accountsList() {
    return this.request<Account[]>("/me/accounts", undefined, { auth: true });
  }

  accountById(accountId: string) {
    return this.request<Account>(`/me/accounts/${accountId}`, undefined, { auth: true });
  }

  accountCreate(input: CreateAccountInput) {
    return this.request<Account>("/me/accounts", {
      method: "POST",
      body: JSON.stringify(input)
    }, { auth: true });
  }

  accountUpdate(accountId: string, input: UpdateAccountInput) {
    return this.request<Account>(`/me/accounts/${accountId}`, {
      method: "PATCH",
      body: JSON.stringify(input)
    }, { auth: true });
  }

  accountDelete(accountId: string) {
    return this.request<{ success: boolean }>(`/me/accounts/${accountId}`, {
      method: "DELETE"
    }, { auth: true });
  }

  categoriesList() {
    return this.request<Category[]>("/me/categories", undefined, { auth: true });
  }

  categoryById(categoryId: string) {
    return this.request<Category>(`/me/categories/${categoryId}`, undefined, { auth: true });
  }

  categoryCreate(input: CreateCategoryInput) {
    const normalizedType = input.kind ?? "expense";
    return this.request<Category>("/me/categories", {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        color: input.color ?? "#64748b",
        type: normalizedType,
        kind: normalizedType
      })
    }, { auth: true });
  }

  categoryUpdate(categoryId: string, input: UpdateCategoryInput) {
    const normalizedType = input.kind ?? "expense";
    return this.request<Category>(`/me/categories/${categoryId}`, {
      method: "PUT",
      body: JSON.stringify({
        name: input.name,
        color: input.color ?? "#64748b",
        type: normalizedType,
        kind: normalizedType
      })
    }, { auth: true });
  }

  categoryDelete(categoryId: string) {
    return this.request<{ success: boolean }>(`/me/categories/${categoryId}`, {
      method: "DELETE"
    }, { auth: true });
  }

  transactionsList() {
    return this.request<Transaction[]>("/me/transactions", undefined, { auth: true });
  }

  transactionById(transactionId: string) {
    return this.request<Transaction>(`/me/transactions/${transactionId}`, undefined, { auth: true });
  }

  transactionCreate(input: CreateTransactionInput) {
    const normalizedDate = toIsoDatetime(input.date ?? input.occurredAt);
    return this.request<Transaction>("/me/transactions", {
      method: "POST",
      body: JSON.stringify({
        accountId: Number(input.accountId),
        categoryId: Number(input.categoryId),
        amount: input.amount,
        type: input.type,
        description: input.description,
        date: normalizedDate,
        occurredAt: normalizedDate
      })
    }, { auth: true });
  }

  transactionUpdate(transactionId: string, input: UpdateTransactionInput) {
    const normalizedDate = toIsoDatetime(input.date ?? input.occurredAt);
    return this.request<Transaction>(`/me/transactions/${transactionId}`, {
      method: "PATCH",
      body: JSON.stringify({
        accountId: input.accountId !== undefined ? Number(input.accountId) : undefined,
        categoryId: input.categoryId !== undefined ? Number(input.categoryId) : undefined,
        amount: input.amount,
        type: input.type,
        description: input.description,
        date: normalizedDate,
        occurredAt: normalizedDate
      })
    }, { auth: true });
  }

  transactionDelete(transactionId: string) {
    return this.request<{ success: boolean }>(`/me/transactions/${transactionId}`, {
      method: "DELETE"
    }, { auth: true });
  }

  budgetsList() {
    return this.request<Budget[]>("/me/budgets", undefined, { auth: true });
  }

  budgetById(budgetId: string) {
    return this.request<Budget>(`/me/budgets/${budgetId}`, undefined, { auth: true });
  }

  budgetCreate(input: CreateBudgetInput) {
    return this.request<Budget>("/me/budgets", {
      method: "POST",
      body: JSON.stringify(input)
    }, { auth: true });
  }

  budgetUpdate(budgetId: string, input: UpdateBudgetInput) {
    return this.request<Budget>(`/me/budgets/${budgetId}`, {
      method: "PATCH",
      body: JSON.stringify(input)
    }, { auth: true });
  }

  budgetDelete(budgetId: string) {
    return this.request<{ success: boolean }>(`/me/budgets/${budgetId}`, {
      method: "DELETE"
    }, { auth: true });
  }
}

export const createApiClient = (event: RequestEvent) => new ServerApiClient(event);

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

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

const normalizeAuthResult = (data: Record<string, unknown>): AuthResult => {
  const { accessToken, refreshToken } = extractTokenPair(data);
  const user = asRecord(data.user);
  const fallbackUser = asRecord(data.me);

  if (!accessToken) {
    throw new ApiClientError({
      code: "INVALID_AUTH_RESPONSE",
      message: "Login succeeded but no access token was returned.",
      status: 500,
      details: data
    });
  }

  const resolvedUser = Object.keys(user).length > 0 ? user : fallbackUser;

  return {
    accessToken,
    refreshToken,
    user: {
      id: asString(resolvedUser.id) ?? "",
      email: asString(resolvedUser.email) ?? "",
      firstName: asString(resolvedUser.firstName) ?? asString(resolvedUser.first_name),
      lastName: asString(resolvedUser.lastName) ?? asString(resolvedUser.last_name),
      createdAt: asString(resolvedUser.createdAt) ?? asString(resolvedUser.created_at)
    }
  };
};

const toIsoDatetime = (value: unknown) => {
  const raw = asString(value);
  if (!raw) return "";

  // Input from <input type="date"> arrives as YYYY-MM-DD; backend expects full ISO datetime in UTC.
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw}T00:00:00.000Z`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toISOString();
};
