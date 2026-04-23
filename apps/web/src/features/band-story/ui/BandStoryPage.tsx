import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fronted1Story } from "../data/fronted1Story";
import { filterStoryChapters } from "../lib/filterStoryChapters";
import type { StoryChapter } from "../model/types";
import "./band-story.css";
import { ChapterContent } from "./ChapterContent";
import { ChapterSidebar } from "./ChapterSidebar";
import { RelatedPageTabs } from "./RelatedPageTabs";
import { StoryHero } from "./StoryHero";

function getFallbackChapter(chapters: StoryChapter[]): StoryChapter | null {
  return chapters[0] ?? null;
}

export function BandStoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [chapterSearch, setChapterSearch] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const initialChapter = getFallbackChapter(fronted1Story.chapters);
  const requestedChapterId = searchParams.get("chapter");

  useEffect(() => {
    if (!initialChapter) {
      return;
    }

    const hasMatch = fronted1Story.chapters.some(
      (chapter) => chapter.id === requestedChapterId,
    );

    if (requestedChapterId === initialChapter.id || hasMatch) {
      return;
    }

    setSearchParams({ chapter: initialChapter.id }, { replace: true });
  }, [initialChapter, requestedChapterId, setSearchParams]);

  if (!initialChapter) {
    return (
      <main className="band-story-page">
        <div className="band-story-page__shell">
          <p className="band-story-page__empty">
            No chapter data is available for the current band story import.
          </p>
        </div>
      </main>
    );
  }

  const selectedChapterId = requestedChapterId ?? initialChapter.id;
  const selectedChapter =
    fronted1Story.chapters.find((chapter) => chapter.id === selectedChapterId) ??
    initialChapter;
  const filteredChapters = filterStoryChapters(fronted1Story.chapters, chapterSearch);
  const selectedChapterHidden =
    chapterSearch.trim().length > 0 &&
    !filteredChapters.some((chapter) => chapter.id === selectedChapter.id);

  return (
    <main className="band-story-page">
      <div className="band-story-page__shell">
        <header className="band-story-page__topbar">
          <Link className="band-story-page__backlink" to="/">
            返回首页继续答题
          </Link>
          <span className="band-story-page__source">Fronted1 story import</span>
        </header>

        <RelatedPageTabs pages={fronted1Story.relatedPages} />
        <StoryHero selectedChapter={selectedChapter} story={fronted1Story} />

        <div className="band-story-page__layout">
          <ChapterSidebar
            chapters={filteredChapters}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onSearchTermChange={setChapterSearch}
            onSelectChapter={(chapterId) => {
              setSearchParams({ chapter: chapterId });
              setIsSidebarOpen(false);
            }}
            onToggleOpen={() => setIsSidebarOpen((current) => !current)}
            searchTerm={chapterSearch}
            selectedChapterHidden={selectedChapterHidden}
            selectedChapterId={selectedChapter.id}
            selectedChapterTitle={selectedChapter.title}
            totalCount={fronted1Story.chapters.length}
          />
          <ChapterContent
            chapter={selectedChapter}
            selectedChapterHidden={selectedChapterHidden}
          />
        </div>
      </div>
    </main>
  );
}
