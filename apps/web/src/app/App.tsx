import { useEffect, useState } from "react";
import {
  evaluateQuizResult,
  type MatchComputation,
  type Question,
  type QuestionOption,
  type QuizMetaResponse,
  type QuizAnswerRecord,
} from "@mygobti/quiz-core";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { BandStoryPage } from "../features/band-story";
import {
  QuizContentApiError,
  fetchQuizContent,
  fetchQuizMeta,
  getQuizApiBaseUrl,
} from "../entities/quiz/api/quizContent";
import {
  createRuntimeQuizContent,
  type RuntimeQuizContent,
} from "../entities/quiz/model/runtimeQuiz";
import { PageShell } from "./shell";
import { HomePage } from "../pages/home/HomePage";

type QuizStage = "idle" | "answering" | "completed";

function createEmptyAnswers(
  questions: Question[],
): Array<QuizAnswerRecord | null> {
  return questions.map(() => null);
}

function createAnswerRecord(
  question: Question,
  option: QuestionOption,
): QuizAnswerRecord {
  return {
    questionId: question.id,
    questionType: question.qtype,
    optionId: option.id,
    delta: option.delta,
    latentDelta: option.latentDelta,
    tags: option.tags,
  };
}

export function App() {
  return (
    <Routes>
      <Route element={<TemplateRuntimeLayout />}>
        <Route element={<QuizHomeRoute />} path="/" />
        <Route element={<BandStoryPage />} path="/band-story/*" />
      </Route>
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}

function TemplateRuntimeLayout() {
  return <PageShell footer={<ShellFooter />} topbar={<ShellTopbar />} />;
}

function ShellTopbar() {
  const location = useLocation();
  const isBandStory = location.pathname.startsWith("/band-story");

  return (
    <header className="page-topbar">
      <div className="page-topbar__brand">
        <span className="page-topbar__eyebrow">Template Shell Active</span>
        <strong>MyGObti Runtime</strong>
      </div>
      <div className="page-topbar__meta">
        <span className="page-topbar__chip">
          {isBandStory ? "Band Story Route" : "Legacy Quiz Flow Mounted"}
        </span>
        <nav className="page-topbar__nav" aria-label="primary">
          <Link to="/">Quiz</Link>
          <Link to="/band-story">Band Story</Link>
        </nav>
      </div>
    </header>
  );
}

function ShellFooter() {
  return (
    <div className="page-footer">
      <div>
        <span className="page-footer__eyebrow">QA Loop</span>
        <strong>Keep `npm run dev:api` and `npm run dev:web` resident</strong>
      </div>
      <p>
        新壳层已经接入，但答题主链路仍挂载在 legacy boundary 里。每做完一个
        `02.3` plan 先在浏览器验收，再继续删旧实现。
      </p>
    </div>
  );
}

function QuizHomeRoute() {
  const [runtimeContent, setRuntimeContent] = useState<RuntimeQuizContent | null>(
    null,
  );
  const [meta, setMeta] = useState<QuizMetaResponse | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadMessage, setLoadMessage] = useState(
    "正在从内容服务同步题库版本和运行时快照。",
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [stage, setStage] = useState<QuizStage>("idle");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<QuizAnswerRecord | null>>([]);
  const [result, setResult] = useState<MatchComputation | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

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
        resolvedMeta = await fetchQuizMeta(abortController.signal);
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

  useEffect(() => {
    if (!runtimeContent) {
      return;
    }

    setStage("idle");
    setCurrentQuestionIndex(0);
    setAnswers(createEmptyAnswers(runtimeContent.questions));
    setResult(null);
    setSubmitMessage(null);
  }, [runtimeContent]);

  if (loadState !== "ready" || !runtimeContent) {
    return (
      <main className="experience-shell">
        <section className="hero-stage hero-stage--boot">
          <div className="hero-stage__glow hero-stage__glow--left" />
          <div className="hero-stage__glow hero-stage__glow--right" />
          <div className="hero-stage__inner">
            <div className="boot-shell">
              <div className="boot-card">
                <p className="boot-card__eyebrow">Runtime Content Bootstrap</p>
                <h1>先把题库接上，再开始今晚这场角色测试。</h1>
                <p className="boot-card__lede">
                  Web 端现在会先通过 `{getQuizApiBaseUrl()}` 读取只读内容服务，再保留原有
                  V2.1D 的答题、结果计算和分享体验。
                </p>
                <div className="boot-card__status-list">
                  <div className="boot-card__status-item">
                    <span>当前状态</span>
                    <strong>
                      {loadState === "loading" ? "正在载入内容" : "内容读取失败"}
                    </strong>
                  </div>
                  <div className="boot-card__status-item">
                    <span>版本探测</span>
                    <strong>{meta?.version ?? "等待 `/api/quiz/meta`"}</strong>
                  </div>
                  <div className="boot-card__status-item">
                    <span>读取路径</span>
                    <strong>{meta?.sourcePath ?? "等待内容服务响应"}</strong>
                  </div>
                </div>
                <div
                  className={`boot-card__message ${
                    loadState === "error"
                      ? "boot-card__message--error"
                      : "boot-card__message--info"
                  }`}
                  role={loadState === "error" ? "alert" : "status"}
                >
                  {loadState === "error" ? loadError : loadMessage}
                </div>
                {loadState === "error" ? (
                  <div className="hero-copy__actions">
                    <button
                      className="primary-button"
                      onClick={() => setLoadAttempt((current) => current + 1)}
                      type="button"
                    >
                      重试读取内容
                    </button>
                    <button
                      className="ghost-button"
                      onClick={() => window.location.reload()}
                      type="button"
                    >
                      整页刷新
                    </button>
                  </div>
                ) : null}
                <p className="boot-card__hint">
                  如果这里一直失败，先确认 `apps/api` 是否已启动，或者
                  `VITE_API_BASE_URL` / `VITE_API_PROXY_TARGET` 是否指向正确地址。
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const { characters, meta: runtimeMeta, publicCharacters, questions, quizMeta } =
    runtimeContent;

  function resetQuiz(nextStage: QuizStage) {
    setStage(nextStage);
    setCurrentQuestionIndex(0);
    setAnswers(createEmptyAnswers(questions));
    setResult(null);
    setSubmitMessage(null);
  }

  function handleStart() {
    resetQuiz("answering");
  }

  function handleRestart() {
    resetQuiz("idle");
  }

  function handleSelectOption(question: Question, option: QuestionOption) {
    setAnswers((currentAnswers) => {
      const nextAnswers = [...currentAnswers];
      nextAnswers[currentQuestionIndex] = createAnswerRecord(question, option);
      return nextAnswers;
    });
    setSubmitMessage(null);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }

  function handlePrevious() {
    setSubmitMessage(null);
    setCurrentQuestionIndex((currentIndex) => Math.max(0, currentIndex - 1));
  }

  function handleNext() {
    setSubmitMessage(null);
    setCurrentQuestionIndex((currentIndex) =>
      Math.min(questions.length - 1, currentIndex + 1),
    );
  }

  function handleSubmit() {
    const unansweredIndex = answers.findIndex((answer) => answer === null);

    if (unansweredIndex !== -1) {
      const remainingCount = answers.filter((answer) => answer === null).length;

      setCurrentQuestionIndex(unansweredIndex);
      setSubmitMessage(
        `还有 ${remainingCount} 题没选，先把空白补完再看结果。`,
      );
      return;
    }

    const completedAnswers = answers.filter(
      (answer): answer is QuizAnswerRecord => answer !== null,
    );

    setResult(
      evaluateQuizResult({
        profiles: characters,
        tieBreakerRule: quizMeta.tieBreakerRule,
        answers: completedAnswers,
      }),
    );
    setSubmitMessage(null);
    setStage("completed");
  }

  return (
    <HomePage
      stage={stage}
      questions={questions}
      publicCharacters={publicCharacters}
      contentVersion={runtimeMeta.version}
      contentSourcePath={runtimeMeta.sourcePath}
      currentQuestionIndex={currentQuestionIndex}
      answers={answers}
      result={result}
      submitMessage={submitMessage}
      onStart={handleStart}
      onRestart={handleRestart}
      onSelectOption={handleSelectOption}
      onPrevious={handlePrevious}
      onNext={handleNext}
      onSubmit={handleSubmit}
    />
  );
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
