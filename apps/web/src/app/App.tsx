import { startTransition, useEffect, useState } from "react";
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
  useNavigate,
  useLocation,
} from "react-router-dom";
import { BandStoryPage } from "../features/band-story";
import {
  getQuizApiBaseUrl,
} from "../entities/quiz/api/quizContent";
import { useRuntimeQuizContent } from "../entities/quiz/model/useRuntimeQuizContent";
import { PageShell } from "./shell";
import { HomePage } from "../pages/home/HomePage";
import { ChatAtomsPreviewPage } from "../pages/preview/ChatAtomsPreviewPage";
import { ResultPreviewPage } from "../pages/preview/ResultPreviewPage";

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
        <Route element={<ChatAtomsPreviewPage />} path="/preview/chat-atoms" />
        <Route element={<ResultPreviewPage />} path="/preview/results" />
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
  const isPreview = location.pathname.startsWith("/preview");
  const isHome = location.pathname === "/";
  const currentSurface = isBandStory
    ? "附加阅读"
    : isPreview
      ? "开发预览"
      : "人格测试";
  const homeEntryLabel = isHome ? "测试首页" : "返回测试首页";
  const homeEntryTarget = isHome ? "/" : "/";

  return (
    <header className="page-topbar">
      <div className="page-topbar__brand">
        <span className="page-topbar__eyebrow">MyGO 恶搞人格测试</span>
        <strong>MyGObti</strong>
      </div>
      <div className="page-topbar__meta">
        <span className="page-topbar__chip">{currentSurface}</span>
        <nav className="page-topbar__nav" aria-label="primary">
          <Link to={homeEntryTarget}>{homeEntryLabel}</Link>
        </nav>
      </div>
    </header>
  );
}

function ShellFooter() {
  return (
    <div className="page-footer">
      <div>
        <span className="page-footer__eyebrow">测试提示</span>
        <strong>主线：开始测试 → 答题 → 看结果 → 分享结果</strong>
      </div>
      <p>
        正式体验只保留测试入口、结果页和分享动作；附加阅读与开发预览不再占据一级导航。
      </p>
    </div>
  );
}

function QuizHomeRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const { runtimeContent, meta, loadState, loadMessage, loadError, reload } =
    useRuntimeQuizContent();
  const [stage, setStage] = useState<QuizStage>("idle");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<QuizAnswerRecord | null>>([]);
  const [result, setResult] = useState<MatchComputation | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  function resetQuizState(
    nextStage: QuizStage,
    nextQuestions: Question[],
  ) {
    setStage(nextStage);
    setCurrentQuestionIndex(0);
    setAnswers(createEmptyAnswers(nextQuestions));
    setResult(null);
    setSubmitMessage(null);
  }

  useEffect(() => {
    if (!runtimeContent) {
      return;
    }

    resetQuizState("idle", runtimeContent.questions);
  }, [runtimeContent]);

  useEffect(() => {
    if (!runtimeContent) {
      return;
    }

    const searchParams = new URLSearchParams(location.search);

    if (searchParams.get("start") !== "1") {
      return;
    }

    resetQuizState("answering", runtimeContent.questions);
    navigate("/", { replace: true });
  }, [location.search, navigate, runtimeContent]);

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
                      onClick={reload}
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

  const { characters, publicCharacters, questions, quizMeta } = runtimeContent;

  function resetQuiz(nextStage: QuizStage) {
    resetQuizState(nextStage, questions);
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

  function handleJumpToQuestion(questionIndex: number) {
    setSubmitMessage(null);
    setCurrentQuestionIndex(
      Math.min(Math.max(questionIndex, 0), questions.length - 1),
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

    startTransition(() => {
      setResult(
        evaluateQuizResult({
          profiles: characters,
          tieBreakerRule: quizMeta.tieBreakerRule,
          answers: completedAnswers,
        }),
      );
      setSubmitMessage(null);
      setStage("completed");
    });
  }

  return (
    <HomePage
      stage={stage}
      questions={questions}
      publicCharacters={publicCharacters}
      currentQuestionIndex={currentQuestionIndex}
      answers={answers}
      result={result}
      submitMessage={submitMessage}
      onJumpToQuestion={handleJumpToQuestion}
      onStart={handleStart}
      onRestart={handleRestart}
      onSelectOption={handleSelectOption}
      onPrevious={handlePrevious}
      onNext={handleNext}
      onSubmit={handleSubmit}
    />
  );
}
