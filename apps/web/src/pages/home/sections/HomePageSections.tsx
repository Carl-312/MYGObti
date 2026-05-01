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
  disclaimerText,
  estimatedMinutes,
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
        : "查看档案";
  const primaryAction =
    stage === "idle" ? onStart : stage === "answering" ? onContinue : onViewResult;
  return (
    <section className="hero-stage">
      <div className="hero-stage__glow hero-stage__glow--left" />
      <div className="hero-stage__glow hero-stage__glow--right" />
      <SparkleSticker className="hero-stage__sticker hero-stage__sticker--sparkle" />
      <MusicNoteSticker className="hero-stage__sticker hero-stage__sticker--note" />
      <div className="hero-stage__inner">

        {/* ── 主行动区：居中，开始按钮最优先 ── */}
        <div className="hero-cta-block">
          <h1>
            {`${estimatedMinutes} 分钟测出你最像哪位`}{" "}
            <span className="hero-heading__entity">MyGO</span>{" "}
            角色。
          </h1>
          <div className="hero-cta-block__actions">
            <button className="primary-button primary-button--hero" onClick={primaryAction} type="button">
              <StoryBadgeIcon kind="bubble" />
              {primaryActionLabel}
            </button>
            {stage !== "idle" ? (
              <button className="ghost-button" onClick={onRestart} type="button">
                <StoryBadgeIcon kind="spark" />
                {stage === "answering" ? "重新开始测试" : "再测一次"}
              </button>
            ) : null}
          </div>
          <p className="hero-copy__action-note">
            {stage === "idle"
              ? "按第一反应选，不用猜哪一项更漂亮。"
              : stage === "answering"
                ? "先回到题流把测试做完，档案页在后面等你。"
                : "先看档案，再决定是否重测或分享。"}
          </p>
        </div>

        {/* ── 辅助信息区：流程步骤 ── */}
        <div className="hero-sub">
          <div className="hero-steps" aria-label="test flow">
            <p className="hero-steps__kicker">测试流程</p>
            {stageCopy.map((item, index) => (
              <div className="hero-copy__timeline-item" key={item}>
                <span>0{index + 1}</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>

        <footer className="disclaimer-banner">{disclaimerText}</footer>
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
        : "档案已解锁";

  return (
    <section className="migration-boundary" aria-label="test brief" id="test-brief">
      <div>
        <p className="migration-boundary__eyebrow">测试说明</p>
        <h2>{`先完成 ${questionsCount} 题，再解锁你的档案和分享海报。`}</h2>
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
          <strong>角色档案 / 维度画像 / 海报</strong>
        </div>
      </div>
      <p className="migration-boundary__note">
        按第一反应作答，全部选完就会进入你的角色档案。
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
          summary={`共 ${questionsCount} 道情境题，按第一反应选，答完拿到角色档案和维度画像。`}
          title="开始前只需要知道：怎么答、要多久、做完会拿到什么。"
        >
        <StoryFactGrid items={[...introFactItems]} />
      </StorySectionFrame>

      <div className="intro-grid intro-grid--story">
        <StorySectionFrame
          badge="开始 → 答题 → 结果 → 分享"
          kicker="完成路径"
          summary="一条线走完，不用绕弯路。"
          title="点开始，答完题，解锁档案，分享海报。"
        >
          <StoryMetricStrip items={[...introGuideItems]} />
        </StorySectionFrame>
      </div>
    </section>
  );
}

export function AnsweringStageSection({
  answers,
  currentQuestion: _currentQuestion,
  currentQuestionIndex,
  onJumpToQuestion,
  onNext,
  onPrevious,
  onSelectOption,
  onSubmit,
  progressPercent: _progressPercent,
  questions,
  questionsCount: _questionsCount,
  submitMessage,
}: AnsweringStageSectionProps) {
  return (
    <section className="quiz-room" aria-label="quiz flow">
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
