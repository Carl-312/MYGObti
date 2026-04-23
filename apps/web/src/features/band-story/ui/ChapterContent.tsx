import type { StoryChapter } from "../model/types";
import { SceneSection } from "./SceneSection";

interface ChapterContentProps {
  chapter: StoryChapter;
  selectedChapterHidden: boolean;
}

export function ChapterContent({
  chapter,
  selectedChapterHidden,
}: ChapterContentProps) {
  const sceneGroups = chapter.scenes.map((scene) => ({
    scene,
    groups: chapter.dialogueGroups.filter((group) => group.sceneId === scene.id),
  }));

  return (
    <section className="band-story-content">
      <header className="band-story-content__header">
        <div>
          <p className="band-story-content__eyebrow">{chapter.label}</p>
          <h2>{chapter.title}</h2>
        </div>
        <div className="band-story-content__stats" aria-label="Chapter stats">
          <div>
            <span>内容状态</span>
            <strong>
              {chapter.meta.contentStatus === "full" ? "正文已解析" : "仅保留章节元信息"}
            </strong>
          </div>
          <div>
            <span>场景分段</span>
            <strong>{chapter.meta.sceneCount}</strong>
          </div>
          <div>
            <span>对话块</span>
            <strong>{chapter.meta.dialogueGroupCount}</strong>
          </div>
        </div>
        {chapter.summary ? <p className="band-story-content__summary">{chapter.summary}</p> : null}
      </header>

      {selectedChapterHidden ? (
        <p className="band-story-content__notice" role="status">
          当前章节未出现在左侧筛选列表中，但阅读内容保持不变。
        </p>
      ) : null}

      {chapter.sceneMarkers.length ? (
        <div className="band-story-content__scenes" aria-label="Scene markers">
          {chapter.sceneMarkers.map((marker) => (
            <span className="band-story-content__scene" key={marker}>
              {marker}
            </span>
          ))}
        </div>
      ) : null}

      {chapter.meta.contentStatus === "meta-only" ? (
        <div className="band-story-content__empty">
          <p>
            当前 HTML 快照只保留了这个章节的目录元信息，还没有对应正文。后续如果补到更完整源文件，
            这块会直接复用当前 schema 扩展。
          </p>
        </div>
      ) : (
        <div className="band-story-content__story">
          {sceneGroups.map(({ scene, groups }) => (
            <SceneSection groups={groups} key={scene.id} scene={scene} />
          ))}
        </div>
      )}
    </section>
  );
}
