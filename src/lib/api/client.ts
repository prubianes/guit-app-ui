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

    const payload = await this.parseJson<AuthResult | { accessToken: string; refreshToken?: string }>(
      response
    );

    if (!response.ok || "error" in payload) {
      clearAuthCookies(this.event.cookies);
      return false;
    }

    const data = payload.data;
    const accessToken = "accessToken" in data ? data.accessToken : "";
    const nextRefresh = "refreshToken" in data ? data.refreshToken : undefined;

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
      throw new ApiClientError({
        code: err?.code ?? "UNKNOWN_ERROR",
        message: err?.message ?? "Unknown server error.",
        details: err?.details,
        status: response.status
      });
    }

    return payload.data;
  }

  authRegister(input: { email: string; password: string; firstName?: string; lastName?: string }) {
    return this.request<AuthResult>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  authLogin(input: { email: string; password: string }) {
    return this.request<AuthResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input)
    });
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
    return this.request<Category>("/me/categories", {
      method: "POST",
      body: JSON.stringify(input)
    }, { auth: true });
  }

  categoryUpdate(categoryId: string, input: UpdateCategoryInput) {
    return this.request<Category>(`/me/categories/${categoryId}`, {
      method: "PUT",
      body: JSON.stringify(input)
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
    return this.request<Transaction>("/me/transactions", {
      method: "POST",
      body: JSON.stringify(input)
    }, { auth: true });
  }

  transactionUpdate(transactionId: string, input: UpdateTransactionInput) {
    return this.request<Transaction>(`/me/transactions/${transactionId}`, {
      method: "PATCH",
      body: JSON.stringify(input)
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
