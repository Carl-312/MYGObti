import { startTransition, useEffect, useRef, useState } from "react";
import {
  evaluateQuizResult,
  type MatchComputation,
  type Question,
  type QuestionOption,
  type QuizAnswerRecord,
} from "@mygobti/quiz-core";
import type { RuntimeQuizContent } from "../../entities/quiz/model/runtimeQuiz";
import {
  createPosterFile,
  downloadPoster,
  exportPoster,
} from "../../features/share/lib/exportPoster";
import { sharePoster } from "../../features/share/lib/sharePoster";
import { DISCLAIMER_TEXT } from "../home/copy";
import {
  AnsweringStageSection,
  MigrationBoundaryNotice,
} from "../home/sections/HomePageSections";
import {
  describeAxis,
  describeAxisGap,
  formatAxisValue,
  normalizeAxis,
  toPercent,
} from "../home/result/resultFormatters";
import { ResultStageSection } from "../home/result/ResultStageSection";
import type { ShareStatus } from "../home/types";

type QuizStage = "answering" | "completed";

interface TestPageProps {
  runtimeContent: RuntimeQuizContent;
}

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

export function TestPage({ runtimeContent }: TestPageProps) {
  const { characters, questions, quizMeta } = runtimeContent;
  const posterRef = useRef<HTMLDivElement>(null);
  const quizFlowAnchorRef = useRef<HTMLDivElement>(null);
  const resultAnchorRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<QuizStage>("answering");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<QuizAnswerRecord | null>>(() =>
    createEmptyAnswers(questions),
  );
  const [result, setResult] = useState<MatchComputation | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [isExportingPoster, setIsExportingPoster] = useState(false);
  const [isSharingPoster, setIsSharingPoster] = useState(false);
  const [shareStatus, setShareStatus] = useState<ShareStatus | null>(null);
  const answeredCount = answers.filter((answer) => answer !== null).length;
  const currentQuestion = questions[currentQuestionIndex];
  const progressPercent = Math.round((answeredCount / questions.length) * 100);
  const estimatedMinutes = Math.max(2, Math.ceil(questions.length / 4));
  const leadResult = result?.ranking[0] ?? null;
  const isPosterBusy = isExportingPoster || isSharingPoster;

  function resetQuizState(nextStage: QuizStage, nextQuestions: Question[]) {
    setStage(nextStage);
    setCurrentQuestionIndex(0);
    setAnswers(createEmptyAnswers(nextQuestions));
    setResult(null);
    setSubmitMessage(null);
  }

  useEffect(() => {
    resetQuizState("answering", questions);
  }, [questions]);

  useEffect(() => {
    if (stage !== "completed") {
      setIsExportingPoster(false);
      setIsSharingPoster(false);
      setShareStatus(null);
      return;
    }

    setShareStatus(null);
  }, [leadResult?.id, stage]);

  useEffect(() => {
    if (
      stage !== "answering" ||
      currentQuestionIndex !== 0 ||
      answeredCount !== 0 ||
      !quizFlowAnchorRef.current
    ) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      quizFlowAnchorRef.current?.scrollIntoView({
        block: "start",
        behavior: "auto",
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [answeredCount, currentQuestionIndex, stage]);

  function handleRestart() {
    resetQuizState("answering", questions);
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

  function showPosterNotReady() {
    setShareStatus({
      tone: "error",
      message: "结果海报还没准备好，等页面稳定后再试一次。",
    });
  }

  async function handleDownloadPoster() {
    if (!leadResult || !posterRef.current) {
      showPosterNotReady();
      return;
    }

    setIsExportingPoster(true);
    setShareStatus({
      tone: "info",
      message: "正在生成 PNG 海报，稍等一下。",
    });

    try {
      const asset = await exportPoster(posterRef.current, leadResult.id);

      downloadPoster(asset);
      setShareStatus({
        tone: "success",
        message: "海报已经开始下载，可以直接发群聊了。",
      });
    } catch (error) {
      setShareStatus({
        tone: "error",
        message: getErrorMessage(error, "图片导出失败了，请换个浏览器或再试一次。"),
      });
    } finally {
      setIsExportingPoster(false);
    }
  }

  async function handleSharePoster() {
    if (!leadResult || !posterRef.current) {
      showPosterNotReady();
      return;
    }

    setIsSharingPoster(true);
    setShareStatus({
      tone: "info",
      message: "正在准备分享海报，如果设备支持会直接打开系统分享面板。",
    });

    try {
      const asset = await exportPoster(posterRef.current, leadResult.id);
      const file = createPosterFile(asset);

      if (!file) {
        downloadPoster(asset);
        setShareStatus({
          tone: "warning",
          message: "当前浏览器不支持文件分享，已经自动改成下载图片。",
        });
        return;
      }

      try {
        const outcome = await sharePoster({
          file,
          title: `我是 ${leadResult.name}`,
          text: leadResult.result.posterCaption,
        });

        if (outcome === "shared") {
          setShareStatus({
            tone: "success",
            message: "系统分享面板已经走通，直接选你要发的位置就行。",
          });
          return;
        }

        if (outcome === "cancelled") {
          setShareStatus({
            tone: "info",
            message: "你刚刚取消了分享，页面已经恢复正常，没有报错。",
          });
          return;
        }

        downloadPoster(asset);
        setShareStatus({
          tone: "warning",
          message: "当前设备不支持原生文件分享，已经自动切到下载保存。",
        });
      } catch (error) {
        downloadPoster(asset);
        setShareStatus({
          tone: "warning",
          message: getErrorMessage(
            error,
            "原生分享没成功，已经自动改成下载图片，照样可以手动转发。",
          ),
        });
      }
    } catch (error) {
      setShareStatus({
        tone: "error",
        message: getErrorMessage(error, "海报导出失败了，暂时没法继续分享。"),
      });
    } finally {
      setIsSharingPoster(false);
    }
  }

  return (
    <main className={`experience-shell experience-shell--${stage}`}>
      <div className="content-frame">
        <MigrationBoundaryNotice
          estimatedMinutes={estimatedMinutes}
          questionsCount={questions.length}
          stage={stage}
        />

        {stage === "answering" ? (
          <div id="quiz-flow" ref={quizFlowAnchorRef}>
            <AnsweringStageSection
              answers={answers}
              currentQuestion={currentQuestion}
              currentQuestionIndex={currentQuestionIndex}
              onJumpToQuestion={handleJumpToQuestion}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSelectOption={handleSelectOption}
              onSubmit={handleSubmit}
              progressPercent={progressPercent}
              questions={questions}
              questionsCount={questions.length}
              submitMessage={submitMessage}
            />
          </div>
        ) : null}

        {stage === "completed" && leadResult && result ? (
          <div ref={resultAnchorRef}>
            <ResultStageSection
              describeAxis={describeAxis}
              describeAxisGap={describeAxisGap}
              disclaimerText={DISCLAIMER_TEXT}
              formatAxisValue={formatAxisValue}
              handleDownloadPoster={handleDownloadPoster}
              handleSharePoster={handleSharePoster}
              isExportingPoster={isExportingPoster}
              isPosterBusy={isPosterBusy}
              isSharingPoster={isSharingPoster}
              leadResult={leadResult}
              normalizeAxis={normalizeAxis}
              posterRef={posterRef}
              result={result}
              shareStatus={shareStatus}
              toPercent={toPercent}
              onRestart={handleRestart}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
