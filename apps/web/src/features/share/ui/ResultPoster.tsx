import { forwardRef } from "react";
import {
  type HiddenMatchResult,
  type MatchResult,
  type TieBreakDecision,
} from "@mygobti/quiz-core";
import {
  CharacterLive2DSlot,
  CharacterRoundAvatar,
} from "../../../entities/character/ui";
import "./result-poster.css";

export const HIDDEN_TAG_LABELS: Record<string, string> = {
  "status-guard": "高自尊防御",
  caretaker: "照料倾向",
  abandonment: "被抛下警报",
  "top-rank-hidden": "全量候选已压过公开榜首",
  "latent-tie-break": "latent 收束后仍偏向祥子",
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
          <strong>人格测试结果海报</strong>
        </div>

        <div className="result-poster__hero">
          <div className="result-poster__identity">
            <p className="result-poster__eyebrow">你测出来是</p>
            <div className="result-poster__identity-row">
              <CharacterRoundAvatar characterId={leadResult.id} label={leadResult.name} size="lg" />
              <div>
                <h3>{leadResult.name}</h3>
                <p className="result-poster__title">{leadResult.title}</p>
              </div>
            </div>
            <p className="result-poster__summary">{leadResult.result.shortReview}</p>
          </div>
          <CharacterLive2DSlot
            characterId={leadResult.id}
            className="result-poster__live2d"
            label={leadResult.name}
          />
        </div>

        <div className="result-poster__scoreband">
          <div>
            <span>公开榜首</span>
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
          <span className="result-poster__label">补充提示</span>
          {hiddenMatch ? (
            <>
              <strong>
                检测到额外倾向：{hiddenMatch.name} / {hiddenMatch.title}
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
              <strong>本次没有额外补充提示</strong>
              <p>海报会继续保留公开主结果，不会插入会盖过主结论的额外信息。</p>
            </>
          )}
        </div>

        <div className="result-poster__footer">
          <p>
            {tieBreak
              ? `前两名太接近，最后靠「${tieBreak.primaryTrait}」做了收束。`
              : "这次公开榜首足够明确，不需要额外 tie-break。"}
          </p>
          <small>这是一张可直接转发的人格测试结果海报。</small>
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
