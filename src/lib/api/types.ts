export type ApiSuccess<T> = { data: T };

export type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorPayload;

export type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt?: string;
};

export type Tokens = {
  accessToken: string;
  refreshToken?: string;
};

export type AuthResult = {
  user: User;
  accessToken: string;
  refreshToken?: string;
};

export type Account = {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  institution?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Category = {
  id: string;
  name: string;
  color?: string;
  kind?: "income" | "expense";
  createdAt?: string;
  updatedAt?: string;
};

export type Transaction = {
  id: string;
  accountId: string | number;
  categoryId: string | number;
  amount: number;
  type: "income" | "expense";
  description?: string;
  occurredAt?: string;
  date?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Budget = {
  id: string;
  categoryId: string;
  amount: number;
  period: "monthly" | "weekly" | "yearly";
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateAccountInput = {
  name: string;
  type: string;
  currency: string;
  balance: number;
  institution?: string;
};

export type UpdateAccountInput = Partial<CreateAccountInput>;

export type CreateCategoryInput = {
  name: string;
  color?: string;
  kind?: "income" | "expense";
};

export type UpdateCategoryInput = CreateCategoryInput;

export type CreateTransactionInput = {
  accountId: string | number;
  categoryId: string | number;
  amount: number;
  type: "income" | "expense";
  description?: string;
  occurredAt?: string;
  date?: string;
};

export type UpdateTransactionInput = Partial<CreateTransactionInput>;

export type CreateBudgetInput = {
  categoryId: string;
  amount: number;
  period: "monthly" | "weekly" | "yearly";
  startDate?: string;
  endDate?: string;
};

export type UpdateBudgetInput = Partial<CreateBudgetInput>;
