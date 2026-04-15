import { useEffect, useRef, useState } from "react";
import { publicCharacters } from "../../entities/character/model/characters";
import {
  createPosterFile,
  downloadPoster,
  exportPoster,
} from "../../features/share/lib/exportPoster";
import { sharePoster } from "../../features/share/lib/sharePoster";
import {
  HIDDEN_TAG_LABELS,
  ResultPoster,
} from "../../features/share/ui/ResultPoster";
import {
  AXIS_DEFINITIONS,
  type MatchComputation,
  type Question,
  type QuestionOption,
  type QuizAnswerRecord,
} from "../../shared/types/quiz";

const DISCLAIMER_TEXT =
  "本测试纯属 AI 发疯与刻板印象缝合，毫无科学依据，请勿当作心理诊断，也不会收集手机号、邮箱或账号。";

const STAGE_COPY = [
  "首页先确认气氛和免责声明",
  "15 题单选答题，全程只走本地前端",
  "三轴向量匹配后给出角色结果和锐评",
] as const;

type ShareStatusTone = "info" | "success" | "warning" | "error";

interface ShareStatus {
  tone: ShareStatusTone;
  message: string;
}

interface HomePageProps {
  stage: "idle" | "answering" | "completed";
  questions: Question[];
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

export function HomePage({
  stage,
  questions,
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
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const canMoveNext =
    currentQuestionIndex < questions.length - 1 && selectedAnswer !== null;
  const rivalResult = leadResult
    ? result?.ranking.find((candidate) => candidate.id === leadResult.relationships.rivalId) ??
      null
    : null;
  const soulmateResult = leadResult
    ? result?.ranking.find((candidate) => candidate.id === leadResult.relationships.soulmateId) ??
      null
    : null;
  const isPosterBusy = isExportingPoster || isSharingPoster;

  useEffect(() => {
    if (stage !== "completed") {
      setIsExportingPoster(false);
      setIsSharingPoster(false);
      setShareStatus(null);
      return;
    }

    setShareStatus(null);
  }, [leadResult?.id, stage]);

  async function handleDownloadPoster() {
    if (!leadResult || !posterRef.current) {
      setShareStatus({
        tone: "error",
        message: "结果海报还没准备好，等页面稳定后再试一次。",
      });
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
      setShareStatus({
        tone: "error",
        message: "结果海报还没准备好，等页面稳定后再试一次。",
      });
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
      <section className="hero-stage">
        <div className="hero-stage__glow hero-stage__glow--left" />
        <div className="hero-stage__glow hero-stage__glow--right" />
        <div className="hero-stage__inner">
          <header className="masthead">
            <div>
              <p className="masthead__label">MyGObti</p>
              <h1>把深夜群聊、拉扯和乐队失控都测成一个角色。</h1>
            </div>
            <div className="masthead__badge">
              <span>MVP Prototype</span>
              <strong>首页 → 答题 → 结果</strong>
            </div>
          </header>

          <section className="hero-grid">
            <article className="hero-copy">
              <p className="hero-copy__eyebrow">
                MyGO 恶搞人格测试 · 纯前端可玩原型
              </p>
              <p className="hero-copy__lede">
                15 道情境单选题会把你的反应累计成三轴向量，再用余弦相似度匹配最像的
                MyGO 角色。先玩，再决定要不要把朋友一起拖下水。
              </p>
              <div className="hero-copy__actions">
                <button className="primary-button" onClick={onStart} type="button">
                  {stage === "idle" ? "开始测试" : "重新开一局"}
                </button>
                <button className="ghost-button" onClick={onRestart} type="button">
                  回到首页
                </button>
              </div>
              <ul className="hero-copy__timeline">
                {STAGE_COPY.map((item, index) => (
                  <li key={item}>
                    <span>0{index + 1}</span>
                    <p>{item}</p>
                  </li>
                ))}
              </ul>
            </article>

            <aside className="hero-preview" aria-label="quiz preview">
              <div className="hero-preview__chat">
                <p className="hero-preview__title">今晚的群聊正在失控</p>
                <div className="chat-bubble chat-bubble--question">
                  <span>Q{String(currentQuestion.order).padStart(2, "0")}</span>
                  <p>{currentQuestion.prompt}</p>
                </div>
                <div className="chat-bubble chat-bubble--answer">
                  <span>你的反应</span>
                  <p>
                    {selectedAnswer
                      ? currentQuestion.options.find(
                          (option) => option.id === selectedAnswer.optionId,
                        )?.text
                      : "选一个最像你的选项，题目会像消息一样一路往下掉。"}
                  </p>
                </div>
              </div>
              <div className="hero-preview__metrics">
                <div>
                  <span>公开角色</span>
                  <strong>{publicCharacters.length}</strong>
                </div>
                <div>
                  <span>正式题目</span>
                  <strong>{questions.length}</strong>
                </div>
                <div>
                  <span>当前进度</span>
                  <strong>{progressPercent}%</strong>
                </div>
              </div>
            </aside>
          </section>

          <div className="disclaimer-banner">{DISCLAIMER_TEXT}</div>
        </div>
      </section>

      <div className="content-frame">
        {stage === "idle" ? (
          <section className="intro-room" aria-label="home intro">
            <div className="intro-room__header">
              <div>
                <p className="section-kicker">首页</p>
                <h2>先确认玩法，再决定要不要把自己交给这 15 题。</h2>
              </div>
              <div className="progress-summary">
                <strong>{questions.length}</strong>
                <span>题完成局</span>
              </div>
            </div>

            <div className="intro-grid">
              <article className="result-panel">
                <h3>这版 MVP 已经能做什么</h3>
                <ul className="plain-list">
                  <li>首页明确写清免责声明和玩法，不靠外部服务。</li>
                  <li>15 题单页答题，答案会累计成三轴向量。</li>
                  <li>答完后立即跑匹配算法，给出角色、锐评和候选榜单。</li>
                </ul>
              </article>

              <article className="result-panel">
                <h3>公开角色池</h3>
                <div className="cast-list">
                  {publicCharacters.map((character) => (
                    <div className="cast-list__item" key={character.id}>
                      <strong>{character.name}</strong>
                      <p>{character.title}</p>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>
        ) : null}

        {stage === "answering" ? (
          <section className="quiz-room" aria-label="quiz flow">
            <div className="quiz-room__header">
              <div>
                <p className="section-kicker">答题流程</p>
                <h2>{`第 ${currentQuestionIndex + 1} 题，别装没看见。`}</h2>
              </div>
              <div className="progress-summary">
                <strong>
                  {answeredCount}/{questions.length}
                </strong>
                <span>已作答</span>
              </div>
            </div>

            <div className="progress-rail" aria-hidden="true">
              <div
                className="progress-rail__fill"
                style={{ width: `${Math.max(progressPercent, 6)}%` }}
              />
            </div>

            <div className="question-frame">
              <div className="question-frame__meta">
                <span>{currentQuestion.category}</span>
                <span>{currentQuestion.sceneHint}</span>
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
                      <span className="option-tile__id">
                        {option.id.slice(-1).toUpperCase()}
                      </span>
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
                    上一题
                  </button>
                  {!isLastQuestion ? (
                    <button
                      className="ghost-button"
                      disabled={!canMoveNext}
                      onClick={onNext}
                      type="button"
                    >
                      下一题
                    </button>
                  ) : (
                    <button
                      className="primary-button"
                      disabled={selectedAnswer === null}
                      onClick={onSubmit}
                      type="button"
                    >
                      生成结果
                    </button>
                  )}
                </div>
                <p className="question-frame__hint">
                  {submitMessage ??
                    "选项会即时保存；如果想改答案，直接退回上一题重选。"}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {stage === "completed" && leadResult && result ? (
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
                <div className="result-room__pairings">
                  <div>
                    <span>灵魂绑定</span>
                    <strong>{soulmateResult?.name ?? leadResult.relationships.soulmateId}</strong>
                    <p>{soulmateResult?.title ?? "默认羁绊角色"}</p>
                  </div>
                  <div>
                    <span>天选克星</span>
                    <strong>{rivalResult?.name ?? leadResult.relationships.rivalId}</strong>
                    <p>{rivalResult?.title ?? "默认对冲角色"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="result-grid">
              <article className="result-panel result-panel--poster">
                <div className="result-panel__header result-panel__header--stack">
                  <div>
                    <p className="section-kicker">分享海报</p>
                    <h3>这张图就是导出源，不会把整页按钮一起截进去</h3>
                  </div>
                  <p className="result-note">
                    先尝试系统分享，不支持就自动降级成下载保存。
                  </p>
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
                      onClick={handleDownloadPoster}
                      type="button"
                    >
                      {isExportingPoster ? "正在导出..." : "保存海报"}
                    </button>
                    <button
                      className="ghost-button"
                      disabled={isPosterBusy}
                      onClick={handleSharePoster}
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

              <article className="result-panel result-panel--story">
                <div className="result-panel__header">
                  <div>
                    <p className="section-kicker">角色读片</p>
                    <h3>这次为什么会是 {leadResult.name}</h3>
                  </div>
                  <span className="result-panel__badge">公开榜首</span>
                </div>
                <p className="result-panel__lead">{leadResult.result.shortReview}</p>
                <blockquote>{leadResult.result.quote}</blockquote>
                <ul className="signal-list">
                  {leadResult.result.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
                <small>{leadResult.result.posterCaption}</small>
              </article>

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
                    <p>
                      这一层始终只由 `ranking[0]` 决定，保留正常角色榜单与可比较性。
                    </p>
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
                      <p>
                        本次仍只保留公开角色结论，没有额外的隐藏命中卡插层。
                      </p>
                    </div>
                  )}
                  <div className="signal-card signal-card--subtle">
                    <span className="signal-card__label">模糊边界</span>
                    <strong>
                      {result.tieBreak
                        ? `最终用「${axisLabel(result.tieBreak.decisiveAxis)}」收束`
                        : "这次没有触发 tie-break"}
                    </strong>
                    <p>
                      {result.tieBreak
                        ? `前两名差值小于 ${result.tieBreak.threshold.toFixed(2)}，所以额外比较了 ${axisLabel(
                            result.tieBreak.decisiveAxis,
                          )}。`
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
                          style={{
                            left: `${normalizeAxis(axis.userValue)}%`,
                          }}
                        />
                        <div
                          className="axis-row__marker axis-row__marker--anchor"
                          style={{
                            left: `${normalizeAxis(axis.anchorValue)}%`,
                          }}
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
                <strong>想换一套答案，或者专门试一次隐藏祥子触发线？</strong>
                <p className="result-note">
                  结果页会一直保留重测入口，不用先滚回首页。
                </p>
              </div>
              <button className="primary-button" onClick={onRestart} type="button">
                再测一次
              </button>
            </div>

            <div className="disclaimer-banner">{DISCLAIMER_TEXT}</div>
          </section>
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
