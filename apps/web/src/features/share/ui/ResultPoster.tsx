import { forwardRef, type CSSProperties } from "react";
import {
  type HiddenMatchResult,
  type MatchResult,
  type TieBreakDecision,
} from "@mygobti/quiz-core";
import { getCharacterAccent } from "../../../entities/character/model/characterAssets";
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
    const posterStyle = {
      "--poster-accent": getCharacterAccent(leadResult.id),
    } as CSSProperties;
    const visibleHighlights = leadResult.result.highlights.slice(0, 3);
    const visibleRanking = ranking.slice(0, 3);
    const hiddenTags = hiddenMatch?.matchedTags.slice(0, 2) ?? [];
    const hasSupplement = Boolean(hiddenMatch || tieBreak);
    const isCompactName = Array.from(leadResult.name).length >= 4;

    return (
      <div className="result-poster" ref={ref} style={posterStyle}>
        <header className="result-poster__chrome">
          <span className="result-poster__brand">MyGObti</span>
          <strong className="result-poster__poster-tag">人格测试结果</strong>
        </header>

        <section className="result-poster__hero">
          <div className="result-poster__hero-copy">
            <p className="result-poster__eyebrow">你测出来是</p>

            <div className="result-poster__identity">
              <div className="result-poster__avatar-wrap">
                <CharacterRoundAvatar
                  characterId={leadResult.id}
                  label={leadResult.name}
                  size="lg"
                />
              </div>
              <div className="result-poster__name-block">
                <h1
                  className={`result-poster__name${
                    isCompactName ? " result-poster__name--compact" : ""
                  }`}
                >
                  {leadResult.name}
                </h1>
                <p className="result-poster__role">{leadResult.title}</p>
              </div>
            </div>

            <div className="result-poster__score-badge">
              <span>公开榜首</span>
              <strong>{toPercent(leadResult.score)}</strong>
            </div>

            <p className="result-poster__review">{leadResult.result.shortReview}</p>
          </div>

          <div className="result-poster__hero-visual">
            <CharacterLive2DSlot
              characterId={leadResult.id}
              className="result-poster__live2d"
              label={leadResult.name}
            />
          </div>
        </section>

        <section className="result-poster__caption">
          <p className="result-poster__caption-kicker">为什么像你</p>
          <p className="result-poster__caption-text">{leadResult.result.posterCaption}</p>
        </section>

        <section className="result-poster__proof">
          <div className="result-poster__highlights" aria-label="personality highlights">
            {visibleHighlights.map((highlight) => (
              <span className="result-poster__highlight" key={highlight}>
                {highlight}
              </span>
            ))}
          </div>

          <ul className="result-poster__axis-list">
            {leadResult.axisBreakdown.map((axis) => (
              <li className="result-poster__axis-item" key={axis.axisId}>
                <div className="result-poster__axis-head">
                  <strong className="result-poster__axis-label">{axis.label}</strong>
                  <span className="result-poster__axis-gap">
                    {formatAxisDistance(axis.distance)}
                  </span>
                </div>
                <p className="result-poster__axis-copy">
                  {formatAxisPosterCopy(axis.distance, axis.userValue)}
                </p>
                <div className="result-poster__axis-track" aria-hidden="true">
                  <span
                    className="result-poster__axis-marker result-poster__axis-marker--anchor"
                    style={{ left: `${normalizeAxis(axis.anchorValue)}%` }}
                  />
                  <span
                    className="result-poster__axis-marker result-poster__axis-marker--user"
                    style={{ left: `${normalizeAxis(axis.userValue)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section
          className={`result-poster__meta${hasSupplement ? "" : " result-poster__meta--single"}`}
        >
          <div className="result-poster__ranking">
            <p className="result-poster__section-kicker">公开榜单 Top 3</p>
            <ol className="result-poster__ranking-list">
              {visibleRanking.map((candidate, index) => (
                <li className="result-poster__ranking-item" key={candidate.id}>
                  <span className="result-poster__ranking-rank">#{index + 1}</span>
                  <strong className="result-poster__ranking-name">{candidate.name}</strong>
                  <span className="result-poster__ranking-score">{toPercent(candidate.score)}</span>
                </li>
              ))}
            </ol>
          </div>

          {hasSupplement ? (
            <div className="result-poster__supplement">
              <p className="result-poster__section-kicker">补充观察</p>
              {hiddenMatch ? (
                <>
                  <strong className="result-poster__supplement-title">
                    你也略微接近 {hiddenMatch.name}
                  </strong>
                  <p className="result-poster__supplement-copy">{hiddenMatch.description}</p>
                  {hiddenTags.length ? (
                    <div className="result-poster__supplement-tags">
                      {hiddenTags.map((tag) => (
                        <span key={tag}>{HIDDEN_TAG_LABELS[tag] ?? tag}</span>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : null}
              {tieBreak ? (
                <p className="result-poster__supplement-note">
                  前两名很接近，最后更偏向「{tieBreak.primaryTrait}」。
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <footer className="result-poster__footer">
          <p className="result-poster__footer-line">这是一张值得直接保存和转发的人格测试结果海报</p>
          <small className="result-poster__footer-mark">MyGObti</small>
        </footer>
      </div>
    );
  },
);

function toPercent(score: number): string {
  return `${Math.round(((score + 1) / 2) * 100)}%`;
}

function formatAxisPosterCopy(distance: number, userValue: number): string {
  if (distance <= 0.5) {
    return `${describeAxisBias(userValue)}，和角色几乎重合`;
  }

  if (distance <= 1.2) {
    return `${describeAxisBias(userValue)}，只留一点偏差`;
  }

  if (distance <= 2) {
    return `${describeAxisBias(userValue)}，但差异已经拉开`;
  }

  return `${describeAxisBias(userValue)}，这一轴其实不像对方`;
}

function formatAxisDistance(distance: number): string {
  if (distance <= 0.5) {
    return "几乎重合";
  }

  if (distance <= 1.2) {
    return "轻微偏差";
  }

  if (distance <= 2) {
    return "差异明显";
  }

  return "不太一样";
}

function describeAxisBias(userValue: number): string {
  return userValue >= 0 ? "你在这一轴偏高" : "你在这一轴偏低";
}

function normalizeAxis(value: number): number {
  return ((Math.tanh(value / 3) + 1) / 2) * 100;
}
