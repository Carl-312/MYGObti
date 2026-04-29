import type { CSSProperties, RefObject } from "react";
import type { MatchComputation } from "@mygobti/quiz-core";
import {
  getCharacterAccent,
} from "../../../entities/character/model/characterAssets";
import {
  CharacterLive2DSlot,
  CharacterRoundAvatar,
} from "../../../entities/character/ui";
import { HIDDEN_TAG_LABELS, ResultPoster } from "../../../features/share/ui/ResultPoster";
import type { ShareStatus } from "../types";
import "./result-page.css";

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
  shareStatus: ShareStatus | null;
  onRestart: () => void;
  restartDescription?: string;
  restartHeadline?: string;
  restartLabel?: string;
  describeAxis: (axisId: string, value: number) => string;
  describeAxisGap: (distance: number) => string;
  formatAxisValue: (value: number) => string;
  normalizeAxis: (value: number) => number;
  toPercent: (score: number) => string;
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
  shareStatus,
  onRestart,
  restartDescription = "重新测试会清空这轮答案，然后从第 1 题重新开始。",
  restartHeadline = "想换一套答案，再测一次？",
  restartLabel = "重新开始测试",
  describeAxis,
  describeAxisGap,
  formatAxisValue,
  normalizeAxis,
  toPercent,
}: ResultStageSectionProps) {
  const accentColor = getCharacterAccent(leadResult.id);
  const rankingPreview = result.ranking.slice(0, 4);
  const heroStyle = {
    "--result-accent": accentColor,
  } as CSSProperties;
  const hiddenSignalSummary = result.hiddenMatch
    ? `系统额外捕捉到 ${result.hiddenMatch.name} 这条补充倾向，但公开结果仍以 ${leadResult.name} 为准。`
    : "这轮没有额外补充倾向，公开结果就是你的主结论。";
  const tieBreakSummary = result.tieBreak
    ? `前两名非常接近，系统最后按「${result.tieBreak.primaryTrait}」做了收束。`
    : "这轮结果差距足够明显，不需要额外收束。";

  return (
    <section
      aria-label="personality test result"
      className="result-report"
      style={heroStyle}
    >
      <section className="result-report__hero">
        <div className="result-report__hero-copy">
          <p className="section-kicker">人格测试结果</p>
          <div className="result-report__eyebrow-row">
            <span className="result-report__eyebrow">结果已生成</span>
            <span className="result-report__eyebrow result-report__eyebrow--accent">
              公开榜首 {toPercent(leadResult.score)}
            </span>
          </div>
          <h2>
            你测出来是{" "}
            <span className="result-hero__name-value">{leadResult.name}</span>
          </h2>
          <p className="result-report__title">{leadResult.title}</p>
          <p className="result-report__summary">{leadResult.result.description}</p>

          <div className="result-report__headline-meta" aria-label="result summary">
            <div>
              <span>下一步</span>
              <strong>保存或分享结果</strong>
            </div>
          </div>

          <div className="result-report__chip-row">
            {leadResult.result.highlights.map((highlight) => (
              <span className="result-report__chip" key={highlight}>
                {highlight}
              </span>
            ))}
          </div>
        </div>

        <div className="result-report__hero-visual">
          <div className="result-report__hero-card">
            <div className="result-report__hero-card-head">
              <span>结果已就绪</span>
              <strong>先看结论，再决定要不要细读</strong>
            </div>
            <CharacterLive2DSlot
              characterId={leadResult.id}
              className="result-report__hero-live2d"
              label={leadResult.name}
            />
            <div className="result-report__hero-profile">
              <CharacterRoundAvatar characterId={leadResult.id} label={leadResult.name} size="lg" />
              <div>
                <strong>{leadResult.name}</strong>
                <span>{leadResult.title}</span>
              </div>
            </div>
            <p className="result-report__hero-caption">{leadResult.result.posterCaption}</p>
          </div>
        </div>
      </section>

      <section className="result-report__section">
        <div className="result-report__section-heading">
          <div>
            <p className="section-kicker">结果解释</p>
            <h3>{`这次为什么会测成 ${leadResult.name}`}</h3>
          </div>
          <p>先看这份结论本身，再决定要不要继续细读补充说明。</p>
        </div>

        <div className="result-report__readout">
          <div className="result-report__quote-block">
            <span>一句话结论</span>
            <strong>{leadResult.result.shortReview}</strong>
            <p>{leadResult.result.quote}</p>
          </div>
          <div className="result-report__readout-note">
            <span>怎么看这份结果</span>
            <p>
              这里给的是你这轮答题在当前规则下最接近的结果。后面的内容只负责解释原因和补充边界，不会改写主结论。
            </p>
          </div>
        </div>
      </section>

      <section className="result-report__section">
        <div className="result-report__section-heading">
          <div>
            <p className="section-kicker">三轴解释</p>
            <h3>{`你和 ${leadResult.name} 在哪几条轴上最接近`}</h3>
          </div>
          <p>每一条轴都直接对应这次结果计算，不是额外补写的人设说明。</p>
        </div>

        <div className="result-report__axis-list">
          {leadResult.axisBreakdown.map((axis) => (
            <div className="result-report__axis-row" key={axis.axisId}>
              <div className="result-report__axis-header">
                <div>
                  <strong>{axis.label}</strong>
                  <p>{describeAxis(axis.axisId, axis.userValue)}</p>
                </div>
                <span>{describeAxisGap(axis.distance)}</span>
              </div>
              <div className="result-report__axis-track">
                <div
                  className="result-report__axis-marker result-report__axis-marker--user"
                  style={{ left: `${normalizeAxis(axis.userValue)}%` }}
                />
                <div
                  className="result-report__axis-marker result-report__axis-marker--anchor"
                  style={{ left: `${normalizeAxis(axis.anchorValue)}%` }}
                />
              </div>
              <div className="result-report__axis-values">
                <span>{`你：${formatAxisValue(axis.userValue)}`}</span>
                <span>{`${leadResult.name}：${formatAxisValue(axis.anchorValue)}`}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="result-report__section result-report__section--share">
        <div className="result-report__section-heading">
          <div>
            <p className="section-kicker">分享结果</p>
            <h3>把这次人格测试结果保存下来或直接发出去</h3>
          </div>
          <p>分享动作优先调用系统分享；设备不支持时会自动降级为下载保存。</p>
        </div>

        <div className="result-report__share-layout">
          <div className="result-report__share-copy">
            <div className="result-report__share-bullets">
              <p>{`你测出来是 ${leadResult.name}，海报会保留公开结论和三轴摘要。`}</p>
              <p>如果浏览器不支持直接分享，系统会自动切到保存图片，不会卡住流程。</p>
            </div>
            <div className="result-report__share-actions">
              <button
                className="primary-button"
                disabled={isPosterBusy}
                onClick={() => void handleSharePoster()}
                type="button"
              >
                {isSharingPoster ? "正在分享..." : "分享结果"}
              </button>
              <button
                className="ghost-button"
                disabled={isPosterBusy}
                onClick={() => void handleDownloadPoster()}
                type="button"
              >
                {isExportingPoster ? "正在导出..." : "保存海报"}
              </button>
              {shareStatus ? (
                <div
                  className={`result-report__share-status result-report__share-status--${shareStatus.tone}`}
                  role="status"
                >
                  {shareStatus.message}
                </div>
              ) : null}
            </div>
          </div>

          <div className="result-report__poster-stage">
            <ResultPoster
              hiddenMatch={result.hiddenMatch}
              leadResult={leadResult}
              ranking={result.ranking}
              ref={posterRef}
              tieBreak={result.tieBreak}
            />
          </div>
        </div>
      </section>

      <section className="result-report__section">
        <div className="result-report__section-heading">
          <div>
            <p className="section-kicker">候选榜单</p>
            <h3>除了第一名，你还和谁最接近</h3>
          </div>
          <p>这份榜单只看公开候选，帮助你理解结果边界；主结论仍然是第一名。</p>
        </div>

        <ol className="result-report__ranking-list">
          {rankingPreview.map((candidate, index) => (
            <li key={candidate.id}>
              <div className="result-report__ranking-lead">
                <span>{`#${index + 1}`}</span>
                <CharacterRoundAvatar characterId={candidate.id} label={candidate.name} />
                <div>
                  <strong>{candidate.name}</strong>
                  <p>{candidate.title}</p>
                </div>
              </div>
              <div className="result-report__ranking-meta">
                <em>{toPercent(candidate.score)}</em>
                <small>{candidate.result.shortReview}</small>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="result-report__section">
        <div className="result-report__section-heading">
          <div>
            <p className="section-kicker">补充说明</p>
            <h3>如果你想细看，这轮结果还有哪些边界信息</h3>
          </div>
          <p>这些说明只负责解释边界，不会覆盖公开结果。</p>
        </div>

        <div className="result-report__signal-grid">
          <article className="result-report__signal-card">
            <span>公开榜首</span>
            <strong>{`${leadResult.name} / ${leadResult.title}`}</strong>
            <p>主结论始终看第一名，方便你和其他人直接横向比较结果。</p>
          </article>
          <article className="result-report__signal-card result-report__signal-card--accent">
            <span>补充倾向</span>
            <strong>{result.hiddenMatch ? "检测到额外补充提示" : "没有额外补充提示"}</strong>
            <p>{hiddenSignalSummary}</p>
            {result.hiddenMatch ? (
              <div className="result-report__signal-tags">
                {result.hiddenMatch.matchedTags.map((tag) => (
                  <span key={tag}>{HIDDEN_TAG_LABELS[tag] ?? tag}</span>
                ))}
              </div>
            ) : null}
          </article>
          <article className="result-report__signal-card">
            <span>边界收束</span>
            <strong>{result.tieBreak ? `按 ${result.tieBreak.primaryTrait} 收束` : "没有触发额外收束"}</strong>
            <p>{tieBreakSummary}</p>
          </article>
        </div>
      </section>

      <div className="result-report__footer">
        <div className="result-report__footer-copy">
          <p className="section-kicker">再测一次</p>
          <strong>{restartHeadline}</strong>
          <p>{restartDescription}</p>
        </div>
        <div className="result-report__footer-actions">
          <button className="ghost-button" onClick={onRestart} type="button">
            {restartLabel}
          </button>
        </div>
      </div>

      <div className="disclaimer-banner">{disclaimerText}</div>
    </section>
  );
}
