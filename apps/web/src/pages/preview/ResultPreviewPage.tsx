import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  createPosterFile,
  downloadPoster,
  exportPoster,
} from "../../features/share/lib/exportPoster";
import { sharePoster } from "../../features/share/lib/sharePoster";
import { CharacterRoundAvatar } from "../../entities/character/ui";
import { useRuntimeQuizContent } from "../../entities/quiz/model/useRuntimeQuizContent";
import { ResultStageSection } from "../home/result/ResultStageSection";
import {
  describeAxis,
  describeAxisGap,
  formatAxisValue,
  normalizeAxis,
  toPercent,
} from "../home/result/resultFormatters";
import type { ShareStatus } from "../home/types";
import { createResultPreviewModel } from "./resultPreviewModel";
import "./result-preview.css";

const DISCLAIMER_TEXT =
  "开发态结果预览只用于 QA，不会影响正式用户的答题链路和结果判定。";

export function ResultPreviewPage() {
  const { runtimeContent, loadError, loadMessage, loadState, reload } = useRuntimeQuizContent();
  const [searchParams, setSearchParams] = useSearchParams();
  const posterRef = useRef<HTMLDivElement>(null);
  const [isExportingPoster, setIsExportingPoster] = useState(false);
  const [isSharingPoster, setIsSharingPoster] = useState(false);
  const [shareStatus, setShareStatus] = useState<ShareStatus | null>(null);
  const selectedId = searchParams.get("id");
  const isPosterBusy = isExportingPoster || isSharingPoster;
  const preview = runtimeContent
    ? createResultPreviewModel(
        runtimeContent.characters,
        selectedId ??
          runtimeContent.characters.find((character) => !character.hidden)?.id ??
          runtimeContent.characters[0]?.id ??
          "",
        runtimeContent.quizMeta.tieBreakerRule,
      )
    : null;

  const leadResult = preview?.result.ranking[0] ?? null;

  useEffect(() => {
    if (!preview || selectedId === preview.selectedProfile.id) {
      return;
    }

    setSearchParams({ id: preview.selectedProfile.id }, { replace: true });
  }, [preview, selectedId, setSearchParams]);

  useEffect(() => {
    setShareStatus(null);
  }, [leadResult?.id, preview?.selectedProfile.id]);

  if (loadState !== "ready" || !runtimeContent || !preview || !leadResult) {
    return (
      <main className="result-preview">
        <section className="result-preview__hero">
          <div>
            <p className="result-preview__eyebrow">Dev Result QA</p>
            <h1>结果页开发态验收入口</h1>
            <p>
              这个页面会用真实角色数据生成可切换的结果态，方便反复检查 8 个角色的 hero、
              素材、榜单和海报导出。
            </p>
          </div>
          <div className="result-preview__status-card">
            <span>当前状态</span>
            <strong>{loadState === "error" ? "内容读取失败" : "正在载入内容"}</strong>
            <p>{loadState === "error" ? loadError : loadMessage}</p>
            {loadState === "error" ? (
              <button className="primary-button" onClick={reload} type="button">
                重试读取内容
              </button>
            ) : null}
          </div>
        </section>
      </main>
    );
  }

  const resolvedPreview = preview;
  const resolvedLeadResult = leadResult;

  async function handleDownloadPoster() {
    if (!posterRef.current) {
      setShareStatus({
        tone: "error",
        message: "结果海报还没准备好，等页面稳定后再试一次。",
      });
      return;
    }

    setIsExportingPoster(true);
    setShareStatus({
      tone: "info",
      message: "正在导出当前预览角色的结果海报。",
    });

    try {
      const asset = await exportPoster(posterRef.current, resolvedPreview.selectedProfile.id);

      downloadPoster(asset);
      setShareStatus({
        tone: "success",
        message: "开发态海报已经开始下载，可以直接检查导出内容。",
      });
    } catch (error) {
      setShareStatus({
        tone: "error",
        message: getErrorMessage(error, "开发态海报导出失败了，请再试一次。"),
      });
    } finally {
      setIsExportingPoster(false);
    }
  }

  async function handleSharePoster() {
    if (!posterRef.current) {
      setShareStatus({
        tone: "error",
        message: "结果海报还没准备好，等页面稳定后再试一次。",
      });
      return;
    }

    setIsSharingPoster(true);
    setShareStatus({
      tone: "info",
      message: "正在准备当前预览角色的分享海报。",
    });

    try {
      const asset = await exportPoster(posterRef.current, resolvedPreview.selectedProfile.id);
      const file = createPosterFile(asset);

      if (!file) {
        downloadPoster(asset);
        setShareStatus({
          tone: "warning",
          message: "当前浏览器不支持文件分享，已自动改成下载预览海报。",
        });
        return;
      }

      try {
        const outcome = await sharePoster({
          file,
          title: `我是 ${resolvedLeadResult.name}`,
          text: resolvedLeadResult.result.posterCaption,
        });

        if (outcome === "shared") {
          setShareStatus({
            tone: "success",
            message: "系统分享面板已打开，可以继续检查原生分享链路。",
          });
          return;
        }

        if (outcome === "cancelled") {
          setShareStatus({
            tone: "info",
            message: "你刚刚取消了分享，页面状态已经恢复。",
          });
          return;
        }

        downloadPoster(asset);
        setShareStatus({
          tone: "warning",
          message: "当前设备不支持原生文件分享，已自动回退为下载。",
        });
      } catch (error) {
        downloadPoster(asset);
        setShareStatus({
          tone: "warning",
          message: getErrorMessage(error, "原生分享失败，已自动回退为下载。"),
        });
      }
    } catch (error) {
      setShareStatus({
        tone: "error",
        message: getErrorMessage(error, "预览海报导出失败了。"),
      });
    } finally {
      setIsSharingPoster(false);
    }
  }

  return (
    <main className="result-preview">
      <section className="result-preview__hero">
        <div>
          <p className="result-preview__eyebrow">Dev Result QA</p>
          <h1>快速切换角色结果态，直接验完整终章页面。</h1>
          <p>
            这里不会让你重做整套题。点任意角色就会生成对应的开发态结果，专门用来检查
            hero、三轴解释、候选榜单、Live2D、圆形头像和分享链路。
          </p>
        </div>
        <div className="result-preview__status-card">
          <span>当前预览</span>
          <strong>{`${preview.selectedProfile.name} / ${preview.selectedProfile.title}`}</strong>
          <p>
            {resolvedPreview.usesHiddenOverride
              ? "当前角色原本是隐藏结果，开发态已临时开放为可见结果，方便直接验 hero 与海报。"
              : "当前角色按真实锚点生成结果，可直接对照正式结果页结构验收。"}
          </p>
        </div>
      </section>

      <section className="result-preview__selector">
        <header className="result-preview__selector-head">
          <div>
            <p className="result-preview__eyebrow">角色切换</p>
            <h2>8 个角色一键切换</h2>
          </div>
          <p>会同步刷新结果 hero、海报导出源和整页解释层级。</p>
        </header>

        <div className="result-preview__selector-grid">
          {runtimeContent.characters.map((character) => {
                const isActive = character.id === resolvedPreview.selectedProfile.id;

            return (
              <button
                className={`result-preview__selector-button${
                  isActive ? " result-preview__selector-button--active" : ""
                }`}
                key={character.id}
                onClick={() => setSearchParams({ id: character.id })}
                type="button"
              >
                <CharacterRoundAvatar characterId={character.id} label={character.name} size="lg" />
                <div>
                  <strong>{character.name}</strong>
                  <span>{character.hidden ? "隐藏角色预览" : character.title}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

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
        leadResult={resolvedLeadResult}
        normalizeAxis={normalizeAxis}
        posterRef={posterRef}
        result={resolvedPreview.result}
        restartDescription="这个入口只负责切换 QA 结果态，不会改动正式题库或线上结果。"
        restartHeadline="想继续检查别的角色结果？"
        restartLabel="回到角色切换"
        shareStatus={shareStatus}
        toPercent={toPercent}
        onRestart={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </main>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
