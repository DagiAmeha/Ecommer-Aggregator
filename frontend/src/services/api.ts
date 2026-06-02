import { getIdToken } from "./auth.service";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

type ApiEnvelope<T> = {
  status?: string;
  data?: T;
  message?: string;
  details?: string;
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function getErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const envelope = payload as ApiEnvelope<unknown>;

    if (typeof envelope.message === "string" && envelope.message.length > 0) {
      return envelope.message;
    }

    if (typeof envelope.details === "string" && envelope.details.length > 0) {
      return envelope.details;
    }
  }

  return `API request failed with status ${status}`;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.message) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getIdToken();
  const headers = new Headers(init?.headers || {});

  if (init?.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  });

  const payload = await readResponseBody(response);

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(payload, response.status),
      response.status,
      payload,
    );
  }

  if (
    payload &&
    typeof payload === "object" &&
    "status" in payload &&
    (payload as ApiEnvelope<unknown>).status === "success" &&
    "data" in payload
  ) {
    return (payload as ApiEnvelope<T>).data as T;
  }

  return payload as T;
}
