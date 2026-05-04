import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getErrorMessage = (error: unknown) => {
  if (!error) return "Something went wrong. Please try again.";
  if (typeof error === "string") return error;

  const err = error as any;
  const graphQLErrorMessage = err?.graphQLErrors?.[0]?.message ?? err?.errors?.[0]?.message;
  const networkErrorMessage = err?.networkError?.result?.errors?.[0]?.message ?? err?.networkError?.message;
  const message = graphQLErrorMessage || networkErrorMessage || err?.message;

  if (!message) return "Something went wrong. Please try again.";
  return String(message).replace(/^GraphQL error:\s*/i, "").trim();
};

export const getMutationErrorMessage = (result: any) => {
  const message = result?.errors?.[0]?.message ?? result?.error?.message;
  if (!message) return null;
  return String(message).replace(/^GraphQL error:\s*/i, "").trim();
};

