import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import type { MatchComputation } from "@mygobti/quiz-core";
import {
  getCharacterAccent,
} from "../../../entities/character/model/characterAssets";
import {
  CharacterLive2DSlot,
  CharacterRoundAvatar,
} from "../../../entities/character/ui";
import {
  POSTER_EXPORT_HEIGHT,
  POSTER_EXPORT_WIDTH,
} from "../../../features/share/lib/exportPoster";
import { ResultPoster } from "../../../features/share/ui/ResultPoster";
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
  restartDescription = "重新开始推演会清空当前选择，然后从第 1 题重新展开。",
  restartHeadline = "重置时间线？",
  restartLabel = "重新推演",
  describeAxis,
  describeAxisGap,
  formatAxisValue,
  normalizeAxis,
  toPercent,
}: ResultStageSectionProps) {
  const posterPreviewRef = useRef<HTMLDivElement | null>(null);
  const [posterPreviewScale, setPosterPreviewScale] = useState(1);
  const [posterPreviewHeight, setPosterPreviewHeight] = useState(POSTER_EXPORT_HEIGHT);
  const accentColor = getCharacterAccent(leadResult.id);
  const rankingPreview = result.ranking.slice(0, 4);
  const heroStyle = {
    "--result-accent": accentColor,
  } as CSSProperties;
  const posterPreviewStyle = {
    "--poster-preview-height": `${Math.round(posterPreviewHeight * posterPreviewScale)}px`,
    "--poster-preview-scale": `${posterPreviewScale}`,
  } as CSSProperties;

  useEffect(() => {
    const previewNode = posterPreviewRef.current;
    const posterNode = posterRef.current;

    if (!previewNode || !posterNode) {
      return;
    }

    const updatePosterPreviewMetrics = () => {
      const nextScale = previewNode.clientWidth
        ? Math.min(previewNode.clientWidth / POSTER_EXPORT_WIDTH, 1)
        : 1;
      const nextHeight = Math.max(posterNode.offsetHeight, POSTER_EXPORT_HEIGHT);

      setPosterPreviewScale((currentScale) =>
        Math.abs(currentScale - nextScale) < 0.01 ? currentScale : nextScale,
      );
      setPosterPreviewHeight((currentHeight) =>
        Math.abs(currentHeight - nextHeight) < 1 ? currentHeight : nextHeight,
      );
    };

    updatePosterPreviewMetrics();

    if (typeof ResizeObserver !== "function") {
      window.addEventListener("resize", updatePosterPreviewMetrics);

      return () => {
        window.removeEventListener("resize", updatePosterPreviewMetrics);
      };
    }

    const resizeObserver = new ResizeObserver(() => {
      updatePosterPreviewMetrics();
    });

    resizeObserver.observe(previewNode);
    resizeObserver.observe(posterNode);

    return () => {
      resizeObserver.disconnect();
    };
  }, [leadResult.id, posterRef, result.hiddenMatch, result.tieBreak]);

  return (
    <section
      aria-label="personality test result"
      className="result-report"
      style={heroStyle}
    >
      <section className="result-report__hero">
        <div className="result-report__hero-copy">
          <p className="section-kicker">人格档案</p>
          <div className="result-report__eyebrow-row">
            <span className="result-report__eyebrow">同步测算完毕</span>
            <span className="result-report__eyebrow result-report__eyebrow--accent">
              契合度 {toPercent(leadResult.score)}
            </span>
          </div>
          <h2>
            你的共振角色是{" "}
            <span className="result-hero__name-value">{leadResult.name}</span>
          </h2>
          <p className="result-report__title">{leadResult.title}</p>
          <p className="result-report__summary">{leadResult.result.description}</p>

          <div className="result-report__hero-actions" aria-label="result actions">
            <button
              className="primary-button"
              disabled={isPosterBusy}
              onClick={() => void handleSharePoster()}
              type="button"
            >
              {isSharingPoster ? "正在分享..." : "分享档案"}
            </button>
            <button
              className="ghost-button"
              disabled={isPosterBusy}
              onClick={() => void handleDownloadPoster()}
              type="button"
            >
              {isExportingPoster ? "正在保存..." : "保存海报"}
            </button>
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
              <span>档案已解锁</span>
              <strong>你的角色档案</strong>
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
            <p className="section-kicker">档案解读</p>
            <h3>{`你的性格切片：${leadResult.name}`}</h3>
          </div>
          <p>先看你们最接近的底层反应。</p>
        </div>

        <div className="result-report__readout">
          <div className="result-report__quote-block">
            <span>一句话结论</span>
            <strong>{leadResult.result.shortReview}</strong>
            <p>{leadResult.result.quote}</p>
          </div>
          <div className="result-report__readout-note">
            <span>共振小结</span>
            <p>
              基于这一路的选择，你们的底层逻辑在这些地方达成了共识。
            </p>
          </div>
        </div>
      </section>

      <section className="result-report__section">
        <div className="result-report__section-heading">
          <div>
            <p className="section-kicker">性格维度拆解</p>
            <h3>{`你与 ${leadResult.name} 的思维同频点`}</h3>
          </div>
          <p>这些维度会显出你和角色真正靠近的部分。</p>
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
                <span>{`你的倾向：${formatAxisValue(axis.userValue)}`}</span>
                <span>{`角色锚点：${formatAxisValue(axis.anchorValue)}`}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="result-report__section result-report__section--share">
        <div className="result-report__section-heading">
          <div>
            <p className="section-kicker">分享档案</p>
            <h3>生成你的专属性格档案</h3>
          </div>
        </div>

        <div className="result-report__share-layout">
          <div className="result-report__share-copy">
            <div className="result-report__share-bullets">
              <p>把这份角色档案留存下来，或直接发给同好对照。</p>
            </div>
            <div className="result-report__share-actions">
              <button
                className="primary-button"
                disabled={isPosterBusy}
                onClick={() => void handleSharePoster()}
                type="button"
              >
                {isSharingPoster ? "正在分享..." : "分享档案"}
              </button>
              <button
                className="ghost-button"
                disabled={isPosterBusy}
                onClick={() => void handleDownloadPoster()}
                type="button"
              >
                {isExportingPoster ? "正在保存..." : "保存海报"}
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
            <div
              className="result-report__poster-preview"
              ref={posterPreviewRef}
              style={posterPreviewStyle}
            >
              <ResultPoster
                hiddenMatch={result.hiddenMatch}
                leadResult={leadResult}
                ranking={result.ranking}
                ref={posterRef}
                tieBreak={result.tieBreak}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="result-report__section">
        <div className="result-report__section-heading">
          <div>
            <p className="section-kicker">其他潜在人格</p>
            <h3>与你产生共鸣的其他角色</h3>
          </div>
          <p>看看还有哪些角色与你的反应频率相近。</p>
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
