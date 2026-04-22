import type {
  CharacterProfile,
  MatchComputation,
  Question,
  QuestionOption,
  QuizAnswerRecord,
} from "@mygobti/quiz-core";
import type { RefObject } from "react";
import { Link } from "react-router-dom";
import { HIDDEN_TAG_LABELS, ResultPoster } from "../../../features/share/ui/ResultPoster";
import {
  CharacterSpotlightRail,
  DialogueSceneCard,
  StoryFactGrid,
  StoryGalleryGrid,
  StoryMetricStrip,
  StorySectionFrame,
  type CharacterSpotlightItem,
  type DialogueLine,
  type StoryFactItem,
  type StoryGalleryItem,
  type StoryMetricItem,
} from "../../../shared/ui/story-design";
import {
  CharacterIconBadge,
  ComicArrow,
  EpisodeSeal,
  MusicNoteSticker,
  SparkleSticker,
  StoryBadgeIcon,
} from "../../../shared/ui/story-svg";

export interface ShareStatus {
  tone: "info" | "success" | "warning" | "error";
  message: string;
}

export interface HeroCastItem {
  id: string;
  name: string;
  title: string;
  accentColor: string;
}

interface HomeHeroSectionProps {
  contentVersion: string;
  currentQuestionOrder: number;
  disclaimerText: string;
  heroCastItems: HeroCastItem[];
  progressPercent: number;
  publicCharacterCount: number;
  questionsCount: number;
  selectedOptionText: string | null;
  stage: "idle" | "answering" | "completed";
  stageCopy: readonly string[];
  onRestart: () => void;
  onStart: () => void;
}

interface MigrationBoundaryNoticeProps {
  contentSourcePath: string;
  contentVersion: string;
  stage: "idle" | "answering" | "completed";
}

interface IntroStageSectionProps {
  introFactItems: readonly StoryFactItem[];
  introGalleryItems: readonly StoryGalleryItem[];
  introSpotlightItems: readonly CharacterSpotlightItem[];
  questionsCount: number;
}

interface AnsweringStageSectionProps {
  answeredCount: number;
  canMoveNext: boolean;
  currentQuestion: Question;
  currentQuestionIndex: number;
  isLastQuestion: boolean;
  progressPercent: number;
  questionsCount: number;
  quizMetricItems: readonly StoryMetricItem[];
  quizSceneLines: readonly DialogueLine[];
  selectedAnswer: QuizAnswerRecord | null;
  submitMessage: string | null;
  onNext: () => void;
  onPrevious: () => void;
  onSelectOption: (question: Question, option: QuestionOption) => void;
  onSubmit: () => void;
}

interface ResultStageSectionProps {
  disclaimerText: string;
  handleDownloadPoster: () => Promise<void>;
  handleSharePoster: () => Promise<void>;
  isExportingPoster: boolean;
  isPosterBusy: boolean;
  isSharingPoster: boolean;
  leadResult: MatchComputation["ranking"][number];
  posterRef: RefObject<HTMLDivElement | null>;
  result: MatchComputation;
  resultArchiveFacts: readonly StoryFactItem[];
  resultMetricItems: readonly StoryMetricItem[];
  resultSceneLines: readonly DialogueLine[];
  resultSpotlightItems: readonly CharacterSpotlightItem[];
  shareStatus: ShareStatus | null;
  onRestart: () => void;
  describeAxis: (axisId: string, value: number) => string;
  describeAxisGap: (distance: number) => string;
  formatAxisValue: (value: number) => string;
  normalizeAxis: (value: number) => number;
  toPercent: (score: number) => string;
}

export function HomeHeroSection({
  contentVersion,
  currentQuestionOrder,
  disclaimerText,
  heroCastItems,
  progressPercent,
  publicCharacterCount,
  questionsCount,
  selectedOptionText,
  stage,
  stageCopy,
  onRestart,
  onStart,
}: HomeHeroSectionProps) {
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
                Band Story Match
              </span>
            </div>
            <h1>把深夜群聊、拉扯和乐队失控都测成一个角色。</h1>
            <p className="masthead__logline">
              这次不再把首页做成冷档案，而是把它改成更像活动专题页的角色入口。
            </p>
          </div>
          <div className="masthead__archive">
            <div className="announcement-banner">
              <SparkleSticker className="announcement-banner__icon" />
              <div>
                <strong>Fronted1 重启方向</strong>
                <p>角色头像、贴纸徽章、事件牌和漫画气泡继续撑首页，题库内容改由 API 提供。</p>
              </div>
            </div>
            <div className="masthead__badge">
              <EpisodeSeal className="masthead__seal" label="EP01" />
              <div>
                <span>Episode 01</span>
                <strong>首页 → 答题 → 结果</strong>
              </div>
            </div>
            <div className="masthead__archive-meta">
              <span>Character Event Gateway</span>
              <span>{`API Runtime · ${contentVersion}`}</span>
            </div>
          </div>
        </header>

        <section className="hero-grid">
          <article className="hero-copy">
            <div className="hero-copy__stickers" aria-hidden="true">
              <EpisodeSeal className="hero-copy__seal" label="START" />
              <SparkleSticker className="hero-copy__sparkle" />
              <ComicArrow className="hero-copy__arrow" direction="right" />
            </div>
            <p className="hero-copy__eyebrow">MyGO 恶搞人格测试 · 前端答题 + API 内容服务</p>
            <p className="hero-copy__lede">
              {questionsCount} 道情境单选题会先累计三轴向量，再在需要时用 latent
              tie-break 收束爽世/祥子这种模糊边界。先玩，再决定要不要把朋友一起拖下水。
            </p>
            <div className="hero-copy__cast-strip" aria-label="character cast preview">
              {heroCastItems.map((character) => (
                <div className="hero-cast-chip" key={character.id}>
                  <CharacterIconBadge
                    accentColor={character.accentColor}
                    characterId={character.id}
                    label={character.name}
                  />
                  <div>
                    <strong>{character.name}</strong>
                    <span>{character.title}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="hero-copy__actions">
              <button className="primary-button" onClick={onStart} type="button">
                <StoryBadgeIcon kind="bubble" />
                {stage === "idle" ? "进入角色剧情" : "重新开档"}
              </button>
              <button className="ghost-button" onClick={onRestart} type="button">
                <StoryBadgeIcon kind="spark" />
                回到序章
              </button>
              {stage === "idle" ? (
                <Link className="ghost-button hero-copy__story-link" to="/band-story">
                  <StoryBadgeIcon kind="ticket" />
                  查看 Band Story 档案
                </Link>
              ) : null}
            </div>
            <ul className="hero-copy__timeline">
              {stageCopy.map((item, index) => (
                <li key={item}>
                  <span>0{index + 1}</span>
                  <p>{item}</p>
                </li>
              ))}
            </ul>
          </article>

          <aside className="hero-preview" aria-label="quiz preview">
            <div className="hero-preview__badges">
              <span className="hero-preview__badge hero-preview__badge--event">
                <StoryBadgeIcon kind="ticket" />
                Event Card
              </span>
              <span className="hero-preview__badge hero-preview__badge--chat">
                <StoryBadgeIcon kind="bubble" />
                Group Chat
              </span>
            </div>
            <div className="hero-preview__chat">
              <p className="hero-preview__title">Story Preview / 今晚的群聊正在失控</p>
              <div className="chat-bubble chat-bubble--question">
                <span>Q{String(currentQuestionOrder).padStart(2, "0")}</span>
                <p>{stage === "completed" ? "结果已经生成，可以直接回看榜单和关系线。" : "当前主链路仍是 legacy 实现，但已经挂进了新模板壳层。"}</p>
              </div>
              <div className="chat-bubble chat-bubble--answer">
                <span>你的反应</span>
                <p>
                  {selectedOptionText ??
                    "选一个最像你的选项，题目会像消息一样一路往下掉。"}
                </p>
              </div>
            </div>
            <div className="hero-preview__metrics">
              <div>
                <span>公开角色</span>
                <strong>{publicCharacterCount}</strong>
              </div>
              <div>
                <span>正式题目</span>
                <strong>{questionsCount}</strong>
              </div>
              <div>
                <span>当前进度</span>
                <strong>{progressPercent}%</strong>
              </div>
            </div>
            <div className="hero-preview__footer">
              <div className="hero-preview__footer-note">
                <MusicNoteSticker className="hero-preview__footer-note-icon" />
                <p>先看角色 presence，再决定要不要把这场测试发到群里。</p>
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
  contentSourcePath,
  contentVersion,
  stage,
}: MigrationBoundaryNoticeProps) {
  const stageLabel =
    stage === "idle" ? "Intro boundary" : stage === "answering" ? "Answering boundary" : "Result boundary";

  return (
    <section className="migration-boundary" aria-label="migration boundary">
      <div>
        <p className="migration-boundary__eyebrow">Gradual Migration Boundary</p>
        <h2>新模板壳层已接管页面框架，旧答题链路仍通过可替换边界继续运行。</h2>
      </div>
      <div className="migration-boundary__meta">
        <div>
          <span>当前挂载</span>
          <strong>{stageLabel}</strong>
        </div>
        <div>
          <span>内容版本</span>
          <strong>{contentVersion}</strong>
        </div>
        <div>
          <span>数据来源</span>
          <strong>{contentSourcePath}</strong>
        </div>
      </div>
      <p className="migration-boundary__note">
        后续计划会按边界逐段替换 intro / quiz / result，而不是继续在一个大组件里叠条件分支。
      </p>
    </section>
  );
}

export function IntroStageSection({
  introFactItems,
  introGalleryItems,
  introSpotlightItems,
  questionsCount,
}: IntroStageSectionProps) {
  return (
    <section className="intro-room" aria-label="home intro">
      <StorySectionFrame
        badge={`Chapter 01 / ${questionsCount} Questions`}
        kicker="首页 / 世界观入口"
        summary="这页先负责把玩法、角色池和结果结构讲清楚，再让你决定要不要把朋友拖进来一起测。"
        title={`先确认玩法，再决定要不要把自己交给这 ${questionsCount} 题。`}
      >
        <StoryFactGrid items={[...introFactItems]} />
      </StorySectionFrame>

      <div className="intro-grid intro-grid--story">
        <DialogueSceneCard
          accentColor="#c16250"
          lines={[
            {
              speaker: "站内公告",
              text: "本测试前端只负责答题和出结果，不收手机号、邮箱，也不装正经心理学。",
              role: "echo",
              avatarLabel: "告",
              avatarIcon: "sakiko",
            },
            {
              speaker: "玩法说明",
              text: `${questionsCount} 道题会先累计三轴，再在边界模糊时用 latent 收束。`,
              role: "primary",
              avatarLabel: "玩",
              avatarIcon: "anon",
            },
            {
              speaker: "你的任务",
              text: "别选体面答案，选更像你会在群聊里真的发出来的那句。",
              role: "secondary",
              avatarLabel: "你",
              avatarIcon: "tomori",
            },
          ]}
          note="先把玩法边界说清楚，这页才能像剧情入口，而不是普通落地页。"
          scene="Archive Notice"
          title="开场不是产品介绍，而是今晚故事的入场说明"
        />

        <StorySectionFrame
          badge="Public Cast"
          kicker="角色预览"
          summary="保留当前公开角色池，只把呈现方式改成更像人物档案与阵容侧写。"
          title="这轮会优先把你落到这些公开角色身上"
        >
          <CharacterSpotlightRail items={[...introSpotlightItems]} />
        </StorySectionFrame>
      </div>

      <StorySectionFrame
        badge="Scene Index"
        kicker="玩法提要"
        summary="这三个板块对应首页、答题和结果三个主要章节，确保整站从开场到分享都像同一部剧情档案。"
        title="当前 React 站点会沿着这条叙事线往下走"
      >
        <StoryGalleryGrid items={[...introGalleryItems]} />
      </StorySectionFrame>
    </section>
  );
}

export function AnsweringStageSection({
  answeredCount,
  canMoveNext,
  currentQuestion,
  currentQuestionIndex,
  isLastQuestion,
  progressPercent,
  questionsCount,
  quizMetricItems,
  quizSceneLines,
  selectedAnswer,
  submitMessage,
  onNext,
  onPrevious,
  onSelectOption,
  onSubmit,
}: AnsweringStageSectionProps) {
  return (
    <section className="quiz-room" aria-label="quiz flow">
      <div className="quiz-room__header">
        <div>
          <p className="section-kicker">答题流程</p>
          <h2>{`第 ${currentQuestionIndex + 1} 题，别装没看见。`}</h2>
        </div>
        <div className="progress-summary">
          <strong>
            {answeredCount}/{questionsCount}
          </strong>
          <span>已作答</span>
        </div>
      </div>

      <StoryMetricStrip items={[...quizMetricItems]} />

      <div className="progress-rail" aria-hidden="true">
        <div
          className="progress-rail__fill"
          style={{ width: `${Math.max(progressPercent, 6)}%` }}
        />
      </div>

      <div className="quiz-room__body">
        <DialogueSceneCard
          accentColor="#d98263"
          lines={[...quizSceneLines]}
          note="把题目先读成一个小场景，再让选项像角色态度一样落下来。"
          scene={`Chapter ${String(currentQuestion.order).padStart(2, "0")}`}
          title="这一幕的现场记录"
        />

        <div className="question-frame">
          <div className="question-frame__meta">
            <span>{currentQuestion.category}</span>
            <span>{currentQuestion.sceneHint}</span>
            <span>{`Question ${String(currentQuestion.order).padStart(2, "0")}`}</span>
          </div>
          <h3>{currentQuestion.prompt}</h3>
          <div className="option-list">
            {currentQuestion.options.map((option) => {
              const isActive = selectedAnswer?.optionId === option.id;

              return (
                <button
                  className={`option-tile${isActive ? " option-tile--active" : ""}`}
                  key={option.id}
                  onClick={() => onSelectOption(currentQuestion, option)}
                  type="button"
                >
                  <span className="option-tile__id">{option.id.slice(-1).toUpperCase()}</span>
                  <div>
                    <strong>{option.text}</strong>
                    <p>{option.resultNote ?? "会被计入三轴向量。"}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="question-frame__footer">
            <div className="question-nav">
              <button
                className="ghost-button"
                disabled={currentQuestionIndex === 0}
                onClick={onPrevious}
                type="button"
              >
                上一章
              </button>
              {!isLastQuestion ? (
                <button
                  className="ghost-button"
                  disabled={!canMoveNext}
                  onClick={onNext}
                  type="button"
                >
                  下一章
                </button>
              ) : (
                <button
                  className="primary-button"
                  disabled={selectedAnswer === null}
                  onClick={onSubmit}
                  type="button"
                >
                  生成角色报告
                </button>
              )}
            </div>
            <p className="question-frame__hint">
              {submitMessage ?? "选项会即时保存；如果想改答案，直接退回上一题重选。"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ResultStageSection({
  disclaimerText,
  handleDownloadPoster,
  handleSharePoster,
  isExportingPoster,
  isPosterBusy,
  isSharingPoster,
  leadResult,
  posterRef,
  result,
  resultArchiveFacts,
  resultMetricItems,
  resultSceneLines,
  resultSpotlightItems,
  shareStatus,
  onRestart,
  describeAxis,
  describeAxisGap,
  formatAxisValue,
  normalizeAxis,
  toPercent,
}: ResultStageSectionProps) {
  return (
    <section className="result-room" aria-label="quiz result">
      <div className="result-room__hero">
        <div className="result-room__hero-copy">
          <p className="section-kicker">结果页</p>
          <p className="result-room__eyebrow">你的公开主结果已经落位</p>
          <h2>{leadResult.name}</h2>
          <p className="result-room__title">{leadResult.title}</p>
          <p className="result-room__summary">{leadResult.result.description}</p>
          <div className="result-room__chips">
            {leadResult.result.highlights.map((highlight) => (
              <span className="result-chip" key={highlight}>
                {highlight}
              </span>
            ))}
          </div>
        </div>

        <div className="result-room__hero-side">
          <div className="result-room__score">
            <span>Top Match</span>
            <strong>{toPercent(leadResult.score)}</strong>
            <p>余弦相似度映射分</p>
          </div>
          <StoryMetricStrip items={[...resultMetricItems]} />
        </div>
      </div>

      <StorySectionFrame
        badge="Relationship File"
        kicker="关系侧写"
        summary="保留原有 soulmate / rival 逻辑，但把它们排成更像人物关系档案的一列。"
        title={`围着 ${leadResult.name} 展开的几条主要关系线`}
      >
        <CharacterSpotlightRail items={[...resultSpotlightItems]} />
      </StorySectionFrame>

      <div className="result-grid">
        <article className="result-panel result-panel--poster">
          <div className="result-panel__header result-panel__header--stack">
            <div>
              <p className="section-kicker">分享海报</p>
              <h3>这张图就是导出源，不会把整页按钮一起截进去</h3>
            </div>
            <p className="result-note">先尝试系统分享，不支持就自动降级成下载保存。</p>
          </div>

          <div className="result-share-layout">
            <ResultPoster
              hiddenMatch={result.hiddenMatch}
              leadResult={leadResult}
              ranking={result.ranking}
              ref={posterRef}
              tieBreak={result.tieBreak}
            />

            <div className="result-share-actions">
              <button
                className="primary-button"
                disabled={isPosterBusy}
                onClick={() => void handleDownloadPoster()}
                type="button"
              >
                {isExportingPoster ? "正在导出..." : "保存角色海报"}
              </button>
              <button
                className="ghost-button"
                disabled={isPosterBusy}
                onClick={() => void handleSharePoster()}
                type="button"
              >
                {isSharingPoster ? "正在分享..." : "手机分享"}
              </button>
              <p className="result-note">
                分享动作只会在你点按钮后触发；桌面端或浏览器不支持时会回退到下载。
              </p>
              {shareStatus ? (
                <div
                  className={`result-share-status result-share-status--${shareStatus.tone}`}
                  role="status"
                >
                  {shareStatus.message}
                </div>
              ) : null}
            </div>
          </div>
        </article>

        <DialogueSceneCard
          accentColor="#da7056"
          lines={[...resultSceneLines]}
          note={leadResult.result.posterCaption}
          scene="角色读片"
          title={`这次为什么会是 ${leadResult.name}`}
        />

        <StorySectionFrame
          badge="Archive Readout"
          kicker="档案摘录"
          summary="把公开榜首、隐藏信号和 tie-break 拆开写清楚，避免结果页只剩一段口号式文案。"
          title="这份结果报告是怎么落位的"
      >
          <StoryFactGrid items={[...resultArchiveFacts]} />
      </StorySectionFrame>

        <article className="result-panel result-panel--signals">
          <div className="result-panel__header">
            <div>
              <p className="section-kicker">结论补充</p>
              <h3>公开结果与隐藏信号分开说</h3>
            </div>
          </div>
          <div className="signal-stack">
            <div className="signal-card">
              <span className="signal-card__label">公开主结果</span>
              <strong>
                {leadResult.name} / {leadResult.title}
              </strong>
              <p>这一层始终只由 `ranking[0]` 决定，保留正常角色榜单与可比较性。</p>
            </div>
            {result.hiddenMatch ? (
              <div className="signal-card signal-card--hidden">
                <span className="signal-card__label">隐藏祥子命中</span>
                <strong>
                  {result.hiddenMatch.name} / {result.hiddenMatch.title}
                </strong>
                <p>{result.hiddenMatch.description}</p>
                <div className="result-room__chips">
                  {result.hiddenMatch.matchedTags.map((tag) => (
                    <span className="result-chip result-chip--hidden" key={tag}>
                      {HIDDEN_TAG_LABELS[tag] ?? tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="signal-card signal-card--muted">
                <span className="signal-card__label">隐藏祥子命中</span>
                <strong>这轮没有触发彩蛋结果</strong>
                <p>本次全量匹配里仍然是公开角色更高，隐藏祥子不会额外插层。</p>
              </div>
            )}
            <div className="signal-card signal-card--subtle">
              <span className="signal-card__label">模糊边界</span>
              <strong>
                {result.tieBreak
                  ? `最终用「${result.tieBreak.primaryTrait}」收束`
                  : "这次没有触发 tie-break"}
              </strong>
              <p>
                {result.tieBreak
                  ? `前两名差值小于 ${result.tieBreak.threshold.toFixed(2)}，且包含 ${result.tieBreak.winnerName} / ${result.tieBreak.runnerUpName}，所以额外比较了 latent 并按 λ=${result.tieBreak.lambda.toFixed(2)} 收束。`
                  : "公开榜首已经足够明确，不需要额外判定收束。"}
              </p>
            </div>
          </div>
        </article>

        <article className="result-panel result-panel--axis">
          <div className="result-panel__header">
            <div>
              <p className="section-kicker">三轴对比</p>
              <h3>你和 {leadResult.name} 的落点差在哪里</h3>
            </div>
          </div>
          <div className="axis-list">
            {leadResult.axisBreakdown.map((axis) => (
              <div className="axis-row" key={axis.axisId}>
                <div className="axis-row__header">
                  <div>
                    <strong>{axis.label}</strong>
                    <p>{describeAxis(axis.axisId, axis.userValue)}</p>
                  </div>
                  <span>{describeAxisGap(axis.distance)}</span>
                </div>
                <div className="axis-row__track">
                  <div
                    className="axis-row__marker axis-row__marker--user"
                    style={{ left: `${normalizeAxis(axis.userValue)}%` }}
                  />
                  <div
                    className="axis-row__marker axis-row__marker--anchor"
                    style={{ left: `${normalizeAxis(axis.anchorValue)}%` }}
                  />
                </div>
                <div className="axis-row__values">
                  <span>你：{formatAxisValue(axis.userValue)}</span>
                  <span>{leadResult.name}：{formatAxisValue(axis.anchorValue)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="result-panel result-panel--ranking">
          <div className="result-panel__header">
            <div>
              <p className="section-kicker">候选榜单</p>
              <h3>最像你的三位角色</h3>
            </div>
          </div>
          <ol className="ranking-list">
            {result.ranking.slice(0, 3).map((candidate, index) => (
              <li key={candidate.id}>
                <div>
                  <span>#{index + 1}</span>
                  <strong>{candidate.name}</strong>
                  <p>{candidate.title}</p>
                </div>
                <em>{toPercent(candidate.score)}</em>
              </li>
            ))}
          </ol>
          <p className="result-note">
            这份榜单只看公开角色匹配，方便你回看自己和其他候选人的距离。
          </p>
        </article>
      </div>

      <div className="result-room__footer result-room__footer--sticky">
        <div className="result-room__footer-copy">
          <p className="section-kicker">再测一次</p>
          <strong>想换一套答案，或者专门试一次爽世/祥子的模糊边界？</strong>
          <p className="result-note">结果页会一直保留重测入口，不用先滚回首页。</p>
        </div>
        <button className="primary-button" onClick={onRestart} type="button">
          重开这条剧情线
        </button>
      </div>

      <div className="disclaimer-banner">{disclaimerText}</div>
    </section>
  );
}
