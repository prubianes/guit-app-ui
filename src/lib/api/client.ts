import type { RequestEvent } from "@sveltejs/kit";
import {
  type Account,
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
import {
  accountSchema,
  accountListSchema,
  authPayloadSchema,
  budgetListSchema,
  budgetSchema,
  categoryListSchema,
  categorySchema,
  parseErrorEnvelope,
  parseSuccessData,
  transactionListSchema,
  transactionSchema,
  userSchema
} from "$lib/api/contracts";
import { adaptCategoryInput, adaptTransactionInput, normalizeAuthResult } from "$lib/api/adapters";
import { z } from "zod";
import { logApiError } from "$lib/utils/logger";

type RequestOptions = {
  auth?: boolean;
  retryOn401?: boolean;
  responseSchema?: z.ZodSchema<unknown>;
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

  private async parseJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
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

    const payload = await this.parseJson(response);
    if (!response.ok) {
      clearAuthCookies(this.event.cookies);
      return false;
    }

    let data: Record<string, unknown>;
    try {
      data = parseSuccessData(authPayloadSchema, payload, response.status, "/auth/refresh") as Record<
        string,
        unknown
      >;
    } catch {
      clearAuthCookies(this.event.cookies);
      return false;
    }

    const normalizedAuth = normalizeAuthResult(data);
    const { accessToken, refreshToken: nextRefresh } = normalizedAuth;

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

    const payload = await this.parseJson(response);

    if (!response.ok) {
      const parsedError = parseErrorEnvelope(payload, response.status);
      const err = parsedError.error;
      const code = err.code ?? "UNKNOWN_ERROR";
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

      logApiError({
        requestId: this.event.locals.requestId,
        route: this.event.route.id ?? undefined,
        endpoint: path,
        method: init?.method ?? "GET",
        code,
        message: err.message ?? "Unknown server error.",
        status: response.status,
        details: err.details
      });

      throw new ApiClientError({
        code,
        message: err.message ?? "Unknown server error.",
        details: err.details,
        status: response.status
      });
    }

    if (!options.responseSchema) {
      const maybeEnvelope = payload as { data?: unknown };
      return (maybeEnvelope?.data ?? payload) as T;
    }

    return parseSuccessData(options.responseSchema as z.ZodSchema<T>, payload, response.status, path);
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
    }, { responseSchema: authPayloadSchema }).then(normalizeAuthResult);
  }

  authLogin(input: { email: string; password: string }) {
    return this.request<Record<string, unknown>>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input)
    }, { responseSchema: authPayloadSchema }).then(normalizeAuthResult);
  }

  authMe() {
    return this.request<User>("/me", undefined, { auth: true, responseSchema: userSchema });
  }

  accountsList() {
    return this.request<Account[]>("/me/accounts", undefined, {
      auth: true,
      responseSchema: accountListSchema
    });
  }

  accountById(accountId: string) {
    return this.request<Account>(`/me/accounts/${accountId}`, undefined, {
      auth: true,
      responseSchema: accountSchema
    });
  }

  accountCreate(input: CreateAccountInput) {
    return this.request<Account>("/me/accounts", {
      method: "POST",
      body: JSON.stringify(input)
    }, { auth: true, responseSchema: accountSchema });
  }

  accountUpdate(accountId: string, input: UpdateAccountInput) {
    return this.request<Account>(`/me/accounts/${accountId}`, {
      method: "PATCH",
      body: JSON.stringify(input)
    }, { auth: true, responseSchema: accountSchema });
  }

  accountDelete(accountId: string) {
    return this.request<{ success: boolean }>(`/me/accounts/${accountId}`, {
      method: "DELETE"
    }, { auth: true });
  }

  categoriesList() {
    return this.request<Category[]>("/me/categories", undefined, {
      auth: true,
      responseSchema: categoryListSchema
    });
  }

  categoryById(categoryId: string) {
    return this.request<Category>(`/me/categories/${categoryId}`, undefined, {
      auth: true,
      responseSchema: categorySchema
    });
  }

  categoryCreate(input: CreateCategoryInput) {
    return this.request<Category>("/me/categories", {
      method: "POST",
      body: JSON.stringify(adaptCategoryInput(input))
    }, { auth: true, responseSchema: categorySchema });
  }

  categoryUpdate(categoryId: string, input: UpdateCategoryInput) {
    return this.request<Category>(`/me/categories/${categoryId}`, {
      method: "PUT",
      body: JSON.stringify(adaptCategoryInput(input))
    }, { auth: true, responseSchema: categorySchema });
  }

  categoryDelete(categoryId: string) {
    return this.request<{ success: boolean }>(`/me/categories/${categoryId}`, {
      method: "DELETE"
    }, { auth: true });
  }

  transactionsList() {
    return this.request<Transaction[]>("/me/transactions", undefined, {
      auth: true,
      responseSchema: transactionListSchema
    });
  }

  transactionById(transactionId: string) {
    return this.request<Transaction>(`/me/transactions/${transactionId}`, undefined, {
      auth: true,
      responseSchema: transactionSchema
    });
  }

  transactionCreate(input: CreateTransactionInput) {
    return this.request<Transaction>("/me/transactions", {
      method: "POST",
      body: JSON.stringify(adaptTransactionInput(input))
    }, { auth: true, responseSchema: transactionSchema });
  }

  transactionUpdate(transactionId: string, input: UpdateTransactionInput) {
    return this.request<Transaction>(`/me/transactions/${transactionId}`, {
      method: "PATCH",
      body: JSON.stringify(adaptTransactionInput(input))
    }, { auth: true, responseSchema: transactionSchema });
  }

  transactionDelete(transactionId: string) {
    return this.request<{ success: boolean }>(`/me/transactions/${transactionId}`, {
      method: "DELETE"
    }, { auth: true });
  }

  budgetsList() {
    return this.request<Budget[]>("/me/budgets", undefined, {
      auth: true,
      responseSchema: budgetListSchema
    });
  }

  budgetById(budgetId: string) {
    return this.request<Budget>(`/me/budgets/${budgetId}`, undefined, {
      auth: true,
      responseSchema: budgetSchema
    });
  }

  budgetCreate(input: CreateBudgetInput) {
    return this.request<Budget>("/me/budgets", {
      method: "POST",
      body: JSON.stringify(input)
    }, { auth: true, responseSchema: budgetSchema });
  }

  budgetUpdate(budgetId: string, input: UpdateBudgetInput) {
    return this.request<Budget>(`/me/budgets/${budgetId}`, {
      method: "PATCH",
      body: JSON.stringify(input)
    }, { auth: true, responseSchema: budgetSchema });
  }

  budgetDelete(budgetId: string) {
    return this.request<{ success: boolean }>(`/me/budgets/${budgetId}`, {
      method: "DELETE"
    }, { auth: true });
  }
}

export const createApiClient = (event: RequestEvent) => new ServerApiClient(event);
