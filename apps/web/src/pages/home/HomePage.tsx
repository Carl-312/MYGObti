import { useEffect, useRef, useState, type RefObject } from "react";
import {
  type CharacterProfile,
  type MatchComputation,
  type Question,
  type QuestionOption,
  type QuizAnswerRecord,
} from "@mygobti/quiz-core";
import {
  createPosterFile,
  downloadPoster,
  exportPoster,
} from "../../features/share/lib/exportPoster";
import { sharePoster } from "../../features/share/lib/sharePoster";
import {
  describeAxis,
  describeAxisGap,
  formatAxisValue,
  normalizeAxis,
  toPercent,
} from "./result/resultFormatters";
import {
  AnsweringStageSection,
  HomeHeroSection,
  IntroStageSection,
  MigrationBoundaryNotice,
} from "./sections/HomePageSections";
import { ResultStageSection } from "./result/ResultStageSection";
import type { ShareStatus } from "./types";

const DISCLAIMER_TEXT =
  "这是整活向人格测试，没有心理诊断效力，也不会收集手机号、邮箱或账号。";

interface HomePageProps {
  stage: "idle" | "answering" | "completed";
  questions: Question[];
  publicCharacters: CharacterProfile[];
  currentQuestionIndex: number;
  answers: Array<QuizAnswerRecord | null>;
  result: MatchComputation | null;
  submitMessage: string | null;
  onJumpToQuestion: (questionIndex: number) => void;
  onStart: () => void;
  onRestart: () => void;
  onSelectOption: (question: Question, option: QuestionOption) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function HomePage({
  stage,
  questions,
  publicCharacters,
  currentQuestionIndex,
  answers,
  result,
  submitMessage,
  onJumpToQuestion,
  onStart,
  onRestart,
  onSelectOption,
  onPrevious,
  onNext,
  onSubmit,
}: HomePageProps) {
  const posterRef = useRef<HTMLDivElement>(null);
  const quizFlowAnchorRef = useRef<HTMLDivElement>(null);
  const resultAnchorRef = useRef<HTMLDivElement>(null);
  const [isExportingPoster, setIsExportingPoster] = useState(false);
  const [isSharingPoster, setIsSharingPoster] = useState(false);
  const [shareStatus, setShareStatus] = useState<ShareStatus | null>(null);
  const answeredCount = answers.filter((answer) => answer !== null).length;
  const currentQuestion = questions[currentQuestionIndex];
  const progressPercent = Math.round((answeredCount / questions.length) * 100);
  const estimatedMinutes = Math.max(2, Math.ceil(questions.length / 4));
  const leadResult = result?.ranking[0] ?? null;
  const isPosterBusy = isExportingPoster || isSharingPoster;
  const stageCopy = [
    `${questions.length} 道情境单选，预计 ${estimatedMinutes} 分钟答完`,
    "按第一反应作答，系统会持续累计角色匹配和三轴判断",
    "完成后立即查看结果，并把海报保存或分享出去",
  ] as const;
  const introFactItems = [
    {
      label: "测试类型",
      value: "MyGO 恶搞人格测试",
      detail: "整页只服务一件事：让你开始测试并顺着主线做到结果页。",
    },
    {
      label: "题目数量",
      value: `${questions.length} 题`,
      detail: "全程情境单选，按第一反应选更像你的答案就行。",
    },
    {
      label: "预计时长",
      value: `${estimatedMinutes} 分钟`,
      detail: "不跳页、不切流程，直接在同一条答题链路里完成。",
    },
    {
      label: "你会拿到",
      value: "角色结果 + 三轴",
      detail: "结果页会先给结论，再给三轴解释和分享海报。",
    },
    {
      label: "结果池",
      value: `${publicCharacters.length} 个公开角色`,
      detail: "角色只作为测试结果出口出现，不会抢走首页的开始动作。",
    },
  ] as const;
  const introGuideItems = [
    { label: "开始", value: "点首屏按钮，直接进入第 1 题" },
    { label: "答题", value: "按顺序答完所有题，不被旁支入口打断" },
    { label: "结果", value: "结果页先看结论，再决定是否分享海报" },
  ] as const;

  function scrollToSection(ref: RefObject<HTMLDivElement | null>) {
    ref.current?.scrollIntoView({
      block: "start",
      behavior: "smooth",
    });
  }

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
      <HomeHeroSection
        currentQuestionOrder={currentQuestion.order}
        disclaimerText={DISCLAIMER_TEXT}
        estimatedMinutes={estimatedMinutes}
        progressPercent={progressPercent}
        questionsCount={questions.length}
        stage={stage}
        stageCopy={stageCopy}
        onContinue={() => scrollToSection(quizFlowAnchorRef)}
        onRestart={onRestart}
        onStart={onStart}
        onViewResult={() => scrollToSection(resultAnchorRef)}
      />

      <div className="content-frame">
        {stage === "idle" ? (
          <MigrationBoundaryNotice
            estimatedMinutes={estimatedMinutes}
            questionsCount={questions.length}
            stage={stage}
          />
        ) : null}
        {stage === "idle" ? (
          <IntroStageSection
            estimatedMinutes={estimatedMinutes}
            introFactItems={introFactItems}
            introGuideItems={introGuideItems}
            questionsCount={questions.length}
          />
        ) : null}

        {stage === "answering" ? (
          <div id="quiz-flow" ref={quizFlowAnchorRef}>
            <AnsweringStageSection
              answers={answers}
              currentQuestion={currentQuestion}
              currentQuestionIndex={currentQuestionIndex}
              onJumpToQuestion={onJumpToQuestion}
              onNext={onNext}
              onPrevious={onPrevious}
              onSelectOption={onSelectOption}
              onSubmit={onSubmit}
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
              onRestart={onRestart}
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
