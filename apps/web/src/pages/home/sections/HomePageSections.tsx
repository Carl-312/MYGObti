import type { Question, QuestionOption, QuizAnswerRecord } from "@mygobti/quiz-core";
import { ChatQuizFlow } from "../../../features/quiz-chat";
import {
  StoryFactGrid,
  StoryMetricStrip,
  StorySectionFrame,
  type StoryFactItem,
  type StoryMetricItem,
} from "../../../shared/ui/story-design";
import {
  ComicArrow,
  EpisodeSeal,
  MusicNoteSticker,
  SparkleSticker,
  StoryBadgeIcon,
} from "../../../shared/ui/story-svg";

interface HomeHeroSectionProps {
  currentQuestionOrder: number;
  disclaimerText: string;
  estimatedMinutes: number;
  progressPercent: number;
  questionsCount: number;
  stage: "idle" | "answering" | "completed";
  stageCopy: readonly string[];
  onContinue: () => void;
  onRestart: () => void;
  onStart: () => void;
  onViewResult: () => void;
}

interface MigrationBoundaryNoticeProps {
  estimatedMinutes: number;
  questionsCount: number;
  stage: "idle" | "answering" | "completed";
}

interface IntroStageSectionProps {
  estimatedMinutes: number;
  introFactItems: readonly StoryFactItem[];
  introGuideItems: readonly StoryMetricItem[];
  questionsCount: number;
}

interface AnsweringStageSectionProps {
  answers: Array<QuizAnswerRecord | null>;
  currentQuestion: Question;
  currentQuestionIndex: number;
  onJumpToQuestion: (questionIndex: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSelectOption: (question: Question, option: QuestionOption) => void;
  onSubmit: () => void;
  progressPercent: number;
  questions: Question[];
  questionsCount: number;
  submitMessage: string | null;
}

export function HomeHeroSection({
  currentQuestionOrder,
  disclaimerText,
  estimatedMinutes,
  progressPercent,
  questionsCount,
  stage,
  stageCopy,
  onContinue,
  onRestart,
  onStart,
  onViewResult,
}: HomeHeroSectionProps) {
  const primaryActionLabel =
    stage === "idle"
      ? "开始测试"
      : stage === "answering"
        ? "继续答题"
        : "查看结果";
  const primaryAction =
    stage === "idle" ? onStart : stage === "answering" ? onContinue : onViewResult;
  const stageSummary =
    stage === "idle"
      ? "点开始测试，马上进入第 1 题。"
      : stage === "answering"
        ? `当前做到第 ${currentQuestionOrder} 题，继续作答就会推进整套测试。`
        : "结果已经生成，往下直接看结论并分享海报。";

  return (
    <section className="hero-stage">
      <div className="hero-stage__glow hero-stage__glow--left" />
      <div className="hero-stage__glow hero-stage__glow--right" />
      <SparkleSticker className="hero-stage__sticker hero-stage__sticker--sparkle" />
      <MusicNoteSticker className="hero-stage__sticker hero-stage__sticker--note" />
      <div className="hero-stage__inner">
        <header className="masthead">
          <div className="masthead__title-block">
            <div className="masthead__label-row">
              <p className="masthead__label">MyGObti</p>
              <span className="masthead__mini-badge">
                <StoryBadgeIcon kind="ticket" />
                MyGO 恶搞人格测试
              </span>
            </div>
            <h1>{`${estimatedMinutes} 分钟测出你最像哪位 MyGO 角色。`}</h1>
            <p className="masthead__logline">
              {`这是一个 MyGO 恶搞人格测试。答完 ${questionsCount} 道情境单选题，你会拿到角色匹配、三轴倾向和可分享结果海报。`}
            </p>
          </div>
        </header>

        <section className="hero-grid">
          <article className="hero-copy">
            <div className="hero-copy__stickers" aria-hidden="true">
              <EpisodeSeal className="hero-copy__seal" label="START" />
              <SparkleSticker className="hero-copy__sparkle" />
              <ComicArrow className="hero-copy__arrow" direction="right" />
            </div>
            <p className="hero-copy__eyebrow">MyGO 恶搞人格测试</p>
            <p className="hero-copy__lede">
              别找标准答案，选更像你第一反应会做的事。首页只负责让你开始测试，结果页再把结论和分享入口给出来。
            </p>
            <div className="hero-copy__actions">
              <button className="primary-button" onClick={primaryAction} type="button">
                <StoryBadgeIcon kind="bubble" />
                {primaryActionLabel}
              </button>
              {stage === "idle" ? (
                <a className="ghost-button" href="#test-brief">
                  <StoryBadgeIcon kind="spark" />
                  查看测试说明
                </a>
              ) : (
                <button className="ghost-button" onClick={onRestart} type="button">
                  <StoryBadgeIcon kind="spark" />
                  {stage === "answering" ? "重新开始测试" : "再测一次"}
                </button>
              )}
            </div>
            <p className="hero-copy__action-note">
              {stage === "idle"
                ? "从这里直接进入第 1 题。"
                : stage === "answering"
                  ? "先回到题流把测试做完，结果页会在后面等你。"
                  : "先看结论，再决定是否重测或分享。"}
            </p>
            <div className="hero-copy__timeline" aria-label="test flow">
              {stageCopy.map((item, index) => (
                <div className="hero-copy__timeline-item" key={item}>
                  <span>0{index + 1}</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </article>

          <aside className="hero-preview" aria-label="quiz preview">
            <div className="hero-preview__badges">
              <span className="hero-preview__badge hero-preview__badge--event">
                <StoryBadgeIcon kind="ticket" />
                开始后立即进入题流
              </span>
              <span className="hero-preview__badge hero-preview__badge--chat">
                <StoryBadgeIcon kind="bubble" />
                完成后直接看结果
              </span>
            </div>
            <div className="hero-preview__chat">
              <p className="hero-preview__title">测试主线</p>
              <div className="chat-bubble chat-bubble--question">
                <span>开始</span>
                <p>点左侧主按钮，直接进入第 1 题，不需要先看设定或附页。</p>
              </div>
              <div className="chat-bubble chat-bubble--answer">
                <span>{stage === "idle" ? "完成后" : "当前状态"}</span>
                <p>{stageSummary}</p>
              </div>
            </div>
          </aside>
        </section>

        <div className="disclaimer-banner">{disclaimerText}</div>
      </div>
    </section>
  );
}

export function MigrationBoundaryNotice({
  estimatedMinutes,
  questionsCount,
  stage,
}: MigrationBoundaryNoticeProps) {
  const stageLabel =
    stage === "idle"
      ? "未开始"
      : stage === "answering"
        ? "答题中"
        : "结果已生成";

  return (
    <section className="migration-boundary" aria-label="test brief" id="test-brief">
      <div>
        <p className="migration-boundary__eyebrow">测试说明</p>
        <h2>{`先完成 ${questionsCount} 题，再查看你的结果和分享海报。`}</h2>
      </div>
      <div className="migration-boundary__meta">
        <div>
          <span>当前状态</span>
          <strong>{stageLabel}</strong>
        </div>
        <div>
          <span>预计时长</span>
          <strong>{`${estimatedMinutes} 分钟`}</strong>
        </div>
        <div>
          <span>完成后得到</span>
          <strong>角色结果 / 三轴 / 海报</strong>
        </div>
      </div>
      <p className="migration-boundary__note">
        开始入口已经放到首屏主按钮，这里只补充必要说明，不再用旁支内容抢注意力。
      </p>
    </section>
  );
}

export function IntroStageSection({
  estimatedMinutes,
  introFactItems,
  introGuideItems,
  questionsCount,
}: IntroStageSectionProps) {
  return (
    <section className="intro-room" aria-label="home intro">
      <StorySectionFrame
        badge={`测试说明 / ${questionsCount} 题`}
        kicker="测试说明"
        summary="首屏已经把开始入口给出来，这里只补充玩法、时长和结果结构。"
        title="开始前只需要知道：怎么答、要多久、做完会拿到什么。"
      >
        <StoryFactGrid items={[...introFactItems]} />
      </StorySectionFrame>

      <div className="intro-grid intro-grid--story">
        <StorySectionFrame
          badge="开始 -> 答题 -> 结果 -> 分享"
          kicker="完成路径"
          summary="把体验压缩成一条连续动作，避免在开始前被角色展示或附加阅读打断。"
          title="整站现在只强调这一条主线"
        >
          <StoryMetricStrip items={[...introGuideItems]} />
        </StorySectionFrame>
      </div>
    </section>
  );
}

export function AnsweringStageSection({
  answers,
  currentQuestion,
  currentQuestionIndex,
  onJumpToQuestion,
  onNext,
  onPrevious,
  onSelectOption,
  onSubmit,
  progressPercent,
  questions,
  questionsCount,
  submitMessage,
}: AnsweringStageSectionProps) {
  const answeredCount = answers.filter((answer) => answer !== null).length;
  const remainingCount = Math.max(questionsCount - answeredCount, 0);
  const quizMetricItems = [
    { label: "当前题号", value: `Q${String(currentQuestion.order).padStart(2, "0")} / ${questionsCount}` },
    { label: "已完成", value: `${answeredCount} 题` },
    { label: "写入判断", value: "角色匹配 / 三轴" },
  ] as const;

  return (
    <section className="quiz-room" aria-label="quiz flow">
      <div className="quiz-room__header">
        <div className="quiz-room__header-copy">
          <p className="section-kicker">答题流程</p>
          <h2>{`人格测试进行中：第 ${currentQuestionIndex + 1} / ${questionsCount} 题`}</h2>
          <p className="quiz-room__header-note">
            当前回答会直接参与角色匹配和三轴倾向判断。聊天只是题目容器，你现在的主任务是把整套测试答完。
          </p>
        </div>
        <div className="progress-summary">
          <span>总体进度</span>
          <strong>{`${progressPercent}%`}</strong>
          <p>{remainingCount === 0 ? "全部题目已完成" : `已答 ${answeredCount} 题，还剩 ${remainingCount} 题`}</p>
        </div>
      </div>

      <StoryMetricStrip items={[...quizMetricItems]} />

      <div className="progress-rail" aria-hidden="true">
        <div
          className="progress-rail__fill"
          style={{ width: `${Math.max(progressPercent, 6)}%` }}
        />
      </div>

      <ChatQuizFlow
        answers={answers}
        currentQuestionIndex={currentQuestionIndex}
        onJumpToQuestion={onJumpToQuestion}
        onNext={onNext}
        onPrevious={onPrevious}
        onSelectOption={onSelectOption}
        onSubmit={onSubmit}
        questions={questions}
        submitMessage={submitMessage}
      />
    </section>
  );
}
