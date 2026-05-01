import { useEffect, useState } from "react";
import type { QuizMetaResponse } from "@mygobti/quiz-core";
import {
  QuizContentApiError,
  fetchQuizContent,
  fetchQuizMeta,
  isRetryableQuizContentError,
} from "../api/quizContent";
import {
  createRuntimeQuizContent,
  type RuntimeQuizContent,
} from "./runtimeQuiz";

type RuntimeLoadState = "loading" | "ready" | "error";

const META_FETCH_RETRY_LIMIT = 20;
const META_FETCH_RETRY_DELAY_MS = 500;

interface RuntimeQuizContentState {
  runtimeContent: RuntimeQuizContent | null;
  meta: QuizMetaResponse | null;
  loadState: RuntimeLoadState;
  loadMessage: string;
  loadError: string | null;
  reload: () => void;
}

export function useRuntimeQuizContent(): RuntimeQuizContentState {
  const [runtimeContent, setRuntimeContent] = useState<RuntimeQuizContent | null>(
    null,
  );
  const [meta, setMeta] = useState<QuizMetaResponse | null>(null);
  const [loadState, setLoadState] = useState<RuntimeLoadState>("loading");
  const [loadMessage, setLoadMessage] = useState(
    "正在从内容服务同步题库版本和运行时快照。",
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    const abortController = new AbortController();
    let active = true;

    async function loadQuizRuntimeContent() {
      setLoadState("loading");
      setLoadError(null);
      setLoadMessage("正在读取 `/api/quiz/meta`，确认这轮题库版本。");
      setRuntimeContent(null);

      let resolvedMeta: QuizMetaResponse | null = null;

      try {
        resolvedMeta = await fetchQuizMetaWithRetry(
          abortController.signal,
          setLoadMessage,
        );
        if (!active) {
          return;
        }

        setMeta(resolvedMeta);
        setLoadMessage(
          `已连接到 ${resolvedMeta.version} 内容服务，继续读取完整题库快照。`,
        );

        const content = await fetchQuizContent(abortController.signal);
        if (!active) {
          return;
        }

        const nextRuntimeContent = createRuntimeQuizContent(resolvedMeta, content);
        setRuntimeContent(nextRuntimeContent);
        setLoadState("ready");
      } catch (error) {
        if (!active || abortController.signal.aborted) {
          return;
        }

        setLoadState("error");
        setLoadError(getLoadErrorMessage(error, resolvedMeta));
      }
    }

    void loadQuizRuntimeContent();

    return () => {
      active = false;
      abortController.abort();
    };
  }, [loadAttempt]);

  return {
    runtimeContent,
    meta,
    loadState,
    loadMessage,
    loadError,
    reload: () => setLoadAttempt((current) => current + 1),
  };
}

async function fetchQuizMetaWithRetry(
  signal: AbortSignal,
  setLoadMessage: (message: string) => void,
): Promise<QuizMetaResponse> {
  for (let attempt = 0; attempt <= META_FETCH_RETRY_LIMIT; attempt += 1) {
    try {
      return await fetchQuizMeta(signal);
    } catch (error) {
      if (signal.aborted || !isRetryableQuizContentError(error)) {
        throw error;
      }

      if (attempt === META_FETCH_RETRY_LIMIT) {
        throw new QuizContentApiError(
          "内容服务启动得比页面慢，已多次重试 `/api/quiz/meta` 仍未连通。",
          {
            cause: error,
            endpoint: "/api/quiz/meta",
          },
        );
      }

      setLoadMessage(
        `内容服务还在启动，正在重试 /api/quiz/meta（第 ${attempt + 2} 次，共 ${
          META_FETCH_RETRY_LIMIT + 1
        } 次）。`,
      );
      await delay(META_FETCH_RETRY_DELAY_MS, signal);
    }
  }

  throw new QuizContentApiError("内容服务初始化重试流程异常结束。", {
    endpoint: "/api/quiz/meta",
  });
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      signal.removeEventListener("abort", handleAbort);
      resolve();
    }, ms);

    function handleAbort() {
      window.clearTimeout(timeoutId);
      reject(new DOMException("The operation was aborted.", "AbortError"));
    }

    signal.addEventListener("abort", handleAbort, { once: true });
  });
}

function getLoadErrorMessage(
  error: unknown,
  meta: QuizMetaResponse | null,
): string {
  if (error instanceof QuizContentApiError) {
    if (meta && error.endpoint.includes("/quiz/content")) {
      return `已经拿到 ${meta.version} 的元信息，但完整题库快照还没拉下来。请检查内容服务日志后重试。`;
    }

    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "题库初始化失败了，但页面没有崩掉。先确认内容服务可达，再点一次重试。";
}
