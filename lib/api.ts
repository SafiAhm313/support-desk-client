import { getToken, clearToken } from "./session";

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  skipAuthRedirect?: boolean;
}

interface ErrorEnvelope {
  statusCode: number;
  message: string | string[];
  timestamp: string;
}

function extractFieldName(msg: string): string {
  // "property dueAt should not exist" -> "dueAt"
  const propertyMatch = msg.match(/^property (\w+)/);
  if (propertyMatch) return propertyMatch[1];
  // "subject must be longer than or equal to 1 characters" -> "subject"
  // "email must be an email" -> "email"
  return msg.split(" ")[0];
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new ApiError(0, "API URL is not configured.");
  }

  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    let message = "Something went wrong.";
    let fieldErrors: Record<string, string> | undefined;

    try {
      const errBody = (await res.json()) as ErrorEnvelope;
      if (Array.isArray(errBody.message)) {
        message = errBody.message.join(" ");
        fieldErrors = {};
        for (const m of errBody.message) {
          const field = extractFieldName(m);
          fieldErrors[field] = m;
        }
      } else if (typeof errBody.message === "string") {
        message = errBody.message;
      }
    } catch {
      // no JSON body
    }

    if (res.status === 401 && !options.skipAuthRedirect) {
      clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    throw new ApiError(res.status, message, fieldErrors);
  }

  return res.json() as Promise<T>;
}
