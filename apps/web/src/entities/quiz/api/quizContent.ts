import type {
  QuizContentSnapshot,
  QuizMetaResponse,
} from "@mygobti/quiz-core";

interface QuizContentApiErrorOptions {
  cause?: unknown;
  endpoint: string;
  status?: number;
}

export class QuizContentApiError extends Error {
  endpoint: string;
  status?: number;

  constructor(message: string, options: QuizContentApiErrorOptions) {
    super(message, { cause: options.cause });
    this.name = "QuizContentApiError";
    this.endpoint = options.endpoint;
    this.status = options.status;
  }
}

export function isRetryableQuizContentError(error: unknown): boolean {
  return error instanceof QuizContentApiError && error.status === undefined;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getQuizApiBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!configuredBaseUrl) {
    return "/api";
  }

  return trimTrailingSlash(configuredBaseUrl);
}

function buildEndpointUrl(pathname: string): string {
  const normalizedBaseUrl = getQuizApiBaseUrl();
  return `${normalizedBaseUrl}${pathname}`;
}

async function requestJson<T>(
  pathname: string,
  signal?: AbortSignal,
): Promise<T> {
  const endpoint = buildEndpointUrl(pathname);
  let response: Response;

  try {
    response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
      },
      signal,
    });
  } catch (error) {
    throw new QuizContentApiError("内容服务暂时连不上。", {
      cause: error,
      endpoint,
    });
  }

  if (!response.ok) {
    throw new QuizContentApiError(
      `内容服务返回了 ${response.status}，暂时没法继续载入题库。`,
      {
        endpoint,
        status: response.status,
      },
    );
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new QuizContentApiError("内容服务返回了无法解析的 JSON。", {
      cause: error,
      endpoint,
      status: response.status,
    });
  }
}

export async function fetchQuizMeta(
  signal?: AbortSignal,
): Promise<QuizMetaResponse> {
  return requestJson<QuizMetaResponse>("/quiz/meta", signal);
}

export async function fetchQuizContent(
  signal?: AbortSignal,
): Promise<QuizContentSnapshot> {
  return requestJson<QuizContentSnapshot>("/quiz/content", signal);
}
