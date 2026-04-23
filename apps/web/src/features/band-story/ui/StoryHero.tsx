import type { BandStoryData, StoryChapter } from "../model/types";

interface StoryHeroProps {
  story: BandStoryData;
  selectedChapter: StoryChapter;
}

export function StoryHero({ story, selectedChapter }: StoryHeroProps) {
  return (
    <section className="band-story-hero">
      <div className="band-story-hero__copy">
        <p className="band-story-hero__eyebrow">Band Story Workbench</p>
        <h1>{story.title}</h1>
        {story.subtitle ? <p className="band-story-hero__subtitle">{story.subtitle}</p> : null}
        {story.intro ? <p className="band-story-hero__intro">{story.intro}</p> : null}
      </div>

      <div className="band-story-hero__facts" aria-label="Story overview">
        <div className="band-story-hero__fact">
          <span>章节数</span>
          <strong>{story.chapters.length}</strong>
        </div>
        <div className="band-story-hero__fact">
          <span>当前章节</span>
          <strong>{selectedChapter.label}</strong>
        </div>
        <div className="band-story-hero__fact">
          <span>内容状态</span>
          <strong>
            {selectedChapter.meta.contentStatus === "full" ? "Parsed" : "Meta only"}
          </strong>
        </div>
        <div className="band-story-hero__fact">
          <span>台词数</span>
          <strong>{selectedChapter.meta.lineCount}</strong>
        </div>
      </div>
    </section>
  );
}
