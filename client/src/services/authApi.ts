import apiClient from "./apiClient";

export type RegisterInput = {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
};

export type SafeUser = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "USER" | "SUB_ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ApiSuccess<T> = {
  success: boolean;
  message: string;
  data: T;
};

export async function registerUser(input: RegisterInput) {
  const { data } = await apiClient.post<ApiSuccess<SafeUser>>("/users/register", input);
  return data;
}

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResponse = { token: string };

export async function loginUser(input: LoginInput) {
  const { data } = await apiClient.post<ApiSuccess<LoginResponse>>("/users/login", input);
  return data;
}

