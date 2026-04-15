import { forwardRef } from "react";
import {
  AXIS_DEFINITIONS,
  type HiddenMatchResult,
  type MatchResult,
  type TieBreakDecision,
} from "../../../shared/types/quiz";

export const HIDDEN_TAG_LABELS: Record<string, string> = {
  "status-guard": "高自尊防御",
  caretaker: "照料倾向",
  abandonment: "被抛下警报",
};

interface ResultPosterProps {
  leadResult: MatchResult;
  ranking: MatchResult[];
  hiddenMatch: HiddenMatchResult | null;
  tieBreak: TieBreakDecision | null;
}

export const ResultPoster = forwardRef<HTMLDivElement, ResultPosterProps>(
  function ResultPoster({ leadResult, ranking, hiddenMatch, tieBreak }, ref) {
    return (
      <div className="result-poster" ref={ref}>
        <div className="result-poster__topline">
          <span>MyGObti</span>
          <strong>纯前端结果海报</strong>
        </div>

        <div className="result-poster__hero">
          <p className="result-poster__eyebrow">你的公开主结果</p>
          <h3>{leadResult.name}</h3>
          <p className="result-poster__title">{leadResult.title}</p>
          <p className="result-poster__summary">{leadResult.result.shortReview}</p>
        </div>

        <div className="result-poster__scoreband">
          <div>
            <span>Top Match</span>
            <strong>{toPercent(leadResult.score)}</strong>
          </div>
          <p>{leadResult.result.posterCaption}</p>
        </div>

        <div className="result-poster__chips">
          {leadResult.result.highlights.map((highlight) => (
            <span key={highlight}>{highlight}</span>
          ))}
        </div>

        <div className="result-poster__grid">
          <section className="result-poster__panel">
            <span className="result-poster__label">三轴摘要</span>
            <ul className="result-poster__axis-list">
              {leadResult.axisBreakdown.map((axis) => (
                <li key={axis.axisId}>
                  <strong>{axis.label}</strong>
                  <span>{formatAxisPosterCopy(axis.distance, axis.userValue)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="result-poster__panel">
            <span className="result-poster__label">公开榜单 Top 3</span>
            <ol className="result-poster__ranking">
              {ranking.slice(0, 3).map((candidate, index) => (
                <li key={candidate.id}>
                  <strong>
                    #{index + 1} {candidate.name}
                  </strong>
                  <span>{candidate.title}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="result-poster__signal">
          <span className="result-poster__label">隐藏祥子信号</span>
          {hiddenMatch ? (
            <>
              <strong>
                已命中 {hiddenMatch.name} / {hiddenMatch.title}
              </strong>
              <p>{hiddenMatch.description}</p>
              <div className="result-poster__chips result-poster__chips--hidden">
                {hiddenMatch.matchedTags.map((tag) => (
                  <span key={tag}>{HIDDEN_TAG_LABELS[tag] ?? tag}</span>
                ))}
              </div>
            </>
          ) : (
            <>
              <strong>本次没有触发隐藏祥子彩蛋</strong>
              <p>海报会继续保留公开主结果，不额外插入隐藏角色 takeover。</p>
            </>
          )}
        </div>

        <div className="result-poster__footer">
          <p>
            {tieBreak
              ? `前两名太接近，最后靠「${axisLabel(tieBreak.decisiveAxis)}」做了收束。`
              : "这次公开榜首足够明确，不需要额外 tie-break。"}
          </p>
          <small>结果只代表今晚群聊气压，不代表人生最终判决。</small>
        </div>
      </div>
    );
  },
);

function toPercent(score: number): string {
  return `${Math.round(((score + 1) / 2) * 100)}%`;
}

function formatAxisPosterCopy(distance: number, userValue: number): string {
  const leaning = userValue >= 0 ? "偏高" : "偏低";

  if (distance <= 0.5) {
    return `${leaning}但几乎重合`;
  }

  if (distance <= 1.2) {
    return `${leaning}，有一点偏差`;
  }

  if (distance <= 2) {
    return `${leaning}，差异已经很明显`;
  }

  return `${leaning}，已经是另一挂人了`;
}

function axisLabel(axisId: string): string {
  return AXIS_DEFINITIONS.find((axis) => axis.id === axisId)?.label ?? axisId;
}
