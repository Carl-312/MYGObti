import { useEffect, useRef, useState } from "react";
import {
  AXIS_DEFINITIONS,
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
import { type StoryMetricItem } from "../../shared/ui/story-design";
import {
  AnsweringStageSection,
  HomeHeroSection,
  IntroStageSection,
  MigrationBoundaryNotice,
  ResultStageSection,
  type HeroCastItem,
  type ShareStatus,
} from "./sections/HomePageSections";

const DISCLAIMER_TEXT =
  "本测试纯属 AI 发疯与刻板印象缝合，毫无科学依据，请勿当作心理诊断，也不会收集手机号、邮箱或账号。";

interface HomePageProps {
  stage: "idle" | "answering" | "completed";
  questions: Question[];
  publicCharacters: CharacterProfile[];
  contentVersion: string;
  contentSourcePath: string;
  currentQuestionIndex: number;
  answers: Array<QuizAnswerRecord | null>;
  result: MatchComputation | null;
  submitMessage: string | null;
  onStart: () => void;
  onRestart: () => void;
  onSelectOption: (question: Question, option: QuestionOption) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

const HERO_ACCENTS = ["#6fa8ff", "#ff8d86", "#ffd45a", "#8be0c1", "#8c80ff"] as const;

export function HomePage({
  stage,
  questions,
  publicCharacters,
  contentVersion,
  contentSourcePath,
  currentQuestionIndex,
  answers,
  result,
  submitMessage,
  onStart,
  onRestart,
  onSelectOption,
  onPrevious,
  onNext,
  onSubmit,
}: HomePageProps) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [isExportingPoster, setIsExportingPoster] = useState(false);
  const [isSharingPoster, setIsSharingPoster] = useState(false);
  const [shareStatus, setShareStatus] = useState<ShareStatus | null>(null);
  const answeredCount = answers.filter((answer) => answer !== null).length;
  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = answers[currentQuestionIndex];
  const progressPercent = Math.round((answeredCount / questions.length) * 100);
  const leadResult = result?.ranking[0] ?? null;
  const runnerUpResult = result?.ranking[1] ?? null;
  const rankingById = result
    ? new Map(result.ranking.map((candidate) => [candidate.id, candidate] as const))
    : null;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const canMoveNext =
    currentQuestionIndex < questions.length - 1 && selectedAnswer !== null;
  const rivalResult = leadResult
    ? rankingById?.get(leadResult.relationships.rivalId) ?? null
    : null;
  const soulmateResult = leadResult
    ? rankingById?.get(leadResult.relationships.soulmateId) ?? null
    : null;
  const isPosterBusy = isExportingPoster || isSharingPoster;
  const stageCopy = [
    "序章先确认气氛、免责声明和玩法边界",
    `${questions.length} 题单选答题，运行时题库由只读内容服务提供`,
    "终章用三轴主模型 + latent 收束给出角色档案",
  ] as const;
  const selectedOptionText =
    selectedAnswer
      ? currentQuestion.options.find((option) => option.id === selectedAnswer.optionId)?.text
      : null;
  const selectedOptionPreview = selectedOptionText ?? null;
  const introFactItems = [
    {
      label: "档案编号",
      value: "FILE 01",
      detail: "这轮升级把首页改成更像剧情入口与世界观资料页。",
    },
    {
      label: "公开角色",
      value: String(publicCharacters.length),
      detail: "公开池保持可比较，隐藏角色只作为额外信号提示。",
    },
    {
      label: "答题长度",
      value: `${questions.length} 题`,
      detail: "单页连续答题，不跳外链，不落库，不引第三方写流程。",
    },
    {
      label: "结果结构",
      value: "公开榜首 + 隐藏信号",
      detail: "结果会分成角色报告、三轴维度、候选榜单和分享海报。",
    },
    {
      label: "运行时版本",
      value: contentVersion,
      detail: `当前题库快照来自 ${contentSourcePath}。`,
    },
  ] as const;
  const introSpotlightItems = publicCharacters.slice(0, 4).map((character) => ({
    name: character.name,
    title: character.title,
    description: character.summary,
    iconId: character.id,
    badge: character.tags[0],
  }));
  const heroCastItems: HeroCastItem[] = publicCharacters
    .slice(0, 5)
    .map((character, index) => ({
      id: character.id,
      name: character.name,
      title: character.title,
      accentColor: HERO_ACCENTS[index % HERO_ACCENTS.length],
    }));
  const introGalleryItems = [
    {
      eyebrow: "序章",
      title: "剧情入口",
      description: "先用海报式开场把免责声明、玩法气氛和世界观入口立住。",
      tone: "yellow",
    },
    {
      eyebrow: "章节",
      title: "答题现场",
      description: "每一道题都像一张事件记录卡，选项更像角色态度而不是表单。",
      tone: "blue",
    },
    {
      eyebrow: "终章",
      title: "角色报告",
      description: "结果区拆成角色读片、信号补充、三轴对照和分享工作台。",
      tone: "yellow",
    },
  ] as const;
  const quizMetricItems: StoryMetricItem[] = [
    { label: "章节编号", value: `Q${String(currentQuestion.order).padStart(2, "0")}` },
    { label: "场景标签", value: currentQuestion.category },
    { label: "推进进度", value: `${answeredCount}/${questions.length}` },
  ] as const;
  const quizSceneLines = [
    {
      speaker: "事件记录",
      text: currentQuestion.sceneHint,
      role: "echo" as const,
      avatarLabel: "记",
      avatarIcon: "sakiko",
    },
    {
      speaker: "系统提问",
      text: currentQuestion.prompt,
      role: "primary" as const,
      avatarLabel: "问",
      avatarIcon: "anon",
    },
    {
      speaker: "你的当前版本",
      text: selectedOptionText ?? "还没落笔。先选一个更像你的态度，让这一幕继续往下走。",
      role: "secondary" as const,
      avatarLabel: "你",
      avatarIcon: "tomori",
    },
  ] as const;
  const resultMetricItems = leadResult
    ? [
        { label: "Top Match", value: toPercent(leadResult.score) },
        { label: "灵魂绑定", value: soulmateResult?.name ?? leadResult.relationships.soulmateId },
        { label: "天选克星", value: rivalResult?.name ?? leadResult.relationships.rivalId },
      ]
    : [];
  const resultSpotlightItems = leadResult
    ? [
        {
          name: soulmateResult?.name ?? leadResult.relationships.soulmateId,
          title: soulmateResult?.title ?? "默认羁绊角色",
          description: "更容易与你同频、接住情绪或把剧情继续推下去的人。",
          iconId: soulmateResult?.id ?? leadResult.relationships.soulmateId,
          badge: "Soulmate",
        },
        {
          name: rivalResult?.name ?? leadResult.relationships.rivalId,
          title: rivalResult?.title ?? "默认对冲角色",
          description: "最容易把你的节奏顶回去、让关系立刻起火花的人。",
          iconId: rivalResult?.id ?? leadResult.relationships.rivalId,
          badge: "Rival",
        },
        ...(runnerUpResult
          ? [
              {
                name: runnerUpResult.name,
                title: runnerUpResult.title,
                description: `公开榜单第二名，得分 ${toPercent(runnerUpResult.score)}。`,
                iconId: runnerUpResult.id,
                badge: "Runner-up",
              },
            ]
          : []),
      ]
    : [];
  const resultArchiveFacts = leadResult
    ? [
        {
          label: "公开榜首",
          value: `${leadResult.name} / ${leadResult.title}`,
          detail: "这层只由 ranking[0] 决定，保证公开榜单的稳定可比较性。",
        },
        {
          label: "隐藏信号",
          value: result?.hiddenMatch ? "已触发彩蛋读取" : "未触发额外插层",
          detail: result?.hiddenMatch
            ? result.hiddenMatch.description
            : "本轮仍以公开角色结果为主，不追加隐藏角色 takeover。",
        },
        {
          label: "模糊边界",
          value: result?.tieBreak ? `按 ${result.tieBreak.primaryTrait} 收束` : "无需 tie-break",
          detail: result?.tieBreak
            ? `前两名分差小于 ${result.tieBreak.threshold.toFixed(2)}，最后按 λ=${result.tieBreak.lambda.toFixed(
                2,
              )} 完成收束。`
            : "这轮公开榜首已经足够明确，不需要额外 latent 判定。",
        },
      ]
    : [];
  const resultSceneLines = leadResult
    ? [
        {
          speaker: "公开结果",
          text: `${leadResult.name} / ${leadResult.title}`,
          role: "primary" as const,
          avatarLabel: leadResult.name.slice(0, 1),
          avatarIcon: leadResult.id,
        },
        {
          speaker: "锐评",
          text: leadResult.result.shortReview,
          role: "secondary" as const,
          avatarLabel: "评",
          avatarIcon: soulmateResult?.id ?? "taki",
        },
        {
          speaker: "角色台词",
          text: leadResult.result.quote,
          role: "echo" as const,
          avatarLabel: "录",
          avatarIcon: rivalResult?.id ?? "anon",
        },
      ]
    : [];

  useEffect(() => {
    if (stage !== "completed") {
      setIsExportingPoster(false);
      setIsSharingPoster(false);
      setShareStatus(null);
      return;
    }

    setShareStatus(null);
  }, [leadResult?.id, stage]);

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
        contentVersion={contentVersion}
        currentQuestionOrder={currentQuestion.order}
        disclaimerText={DISCLAIMER_TEXT}
        heroCastItems={heroCastItems}
        progressPercent={progressPercent}
        publicCharacterCount={publicCharacters.length}
        questionsCount={questions.length}
        selectedOptionText={selectedOptionPreview}
        stage={stage}
        stageCopy={stageCopy}
        onRestart={onRestart}
        onStart={onStart}
      />

      <div className="content-frame">
        <MigrationBoundaryNotice
          contentSourcePath={contentSourcePath}
          contentVersion={contentVersion}
          stage={stage}
        />
        {stage === "idle" ? (
          <IntroStageSection
            introFactItems={introFactItems}
            introGalleryItems={introGalleryItems}
            introSpotlightItems={introSpotlightItems}
            questionsCount={questions.length}
          />
        ) : null}

        {stage === "answering" ? (
          <AnsweringStageSection
            answeredCount={answeredCount}
            canMoveNext={canMoveNext}
            currentQuestion={currentQuestion}
            currentQuestionIndex={currentQuestionIndex}
            isLastQuestion={isLastQuestion}
            progressPercent={progressPercent}
            questionsCount={questions.length}
            quizMetricItems={quizMetricItems}
            quizSceneLines={quizSceneLines}
            selectedAnswer={selectedAnswer}
            submitMessage={submitMessage}
            onNext={onNext}
            onPrevious={onPrevious}
            onSelectOption={onSelectOption}
            onSubmit={onSubmit}
          />
        ) : null}

        {stage === "completed" && leadResult && result ? (
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
            resultArchiveFacts={resultArchiveFacts}
            resultMetricItems={resultMetricItems}
            resultSceneLines={resultSceneLines}
            resultSpotlightItems={resultSpotlightItems}
            shareStatus={shareStatus}
            toPercent={toPercent}
            onRestart={onRestart}
          />
        ) : null}
      </div>
    </main>
  );
}

function normalizeAxis(value: number): number {
  return ((Math.tanh(value / 3) + 1) / 2) * 100;
}

function toPercent(score: number): string {
  return `${Math.round(((score + 1) / 2) * 100)}%`;
}

function axisLabel(axisId: string): string {
  return AXIS_DEFINITIONS.find((axis) => axis.id === axisId)?.label ?? axisId;
}

function formatAxisValue(value: number): string {
  return value >= 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
}

function describeAxis(axisId: string, value: number): string {
  const axis = AXIS_DEFINITIONS.find((item) => item.id === axisId);

  if (!axis) {
    return "维度读取中";
  }

  const leaningLabel = value >= 0 ? axis.highLabel : axis.lowLabel;
  const intensity = Math.abs(value);

  if (intensity >= 2.4) {
    return `非常偏向${leaningLabel}`;
  }

  if (intensity >= 1.2) {
    return `明显偏向${leaningLabel}`;
  }

  return `略偏向${leaningLabel}`;
}

function describeAxisGap(distance: number): string {
  if (distance <= 0.5) {
    return "几乎重合";
  }

  if (distance <= 1.2) {
    return "有一点偏差";
  }

  if (distance <= 2) {
    return "差异明显";
  }

  return "完全不是一挂";
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
