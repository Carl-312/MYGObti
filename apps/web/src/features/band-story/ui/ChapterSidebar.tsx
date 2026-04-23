import type { StoryChapter } from "../model/types";

interface ChapterSidebarProps {
  chapters: StoryChapter[];
  totalCount: number;
  selectedChapterId: string;
  selectedChapterTitle: string;
  selectedChapterHidden: boolean;
  searchTerm: string;
  isOpen: boolean;
  onClose: () => void;
  onSearchTermChange: (value: string) => void;
  onSelectChapter: (chapterId: string) => void;
  onToggleOpen: () => void;
}

export function ChapterSidebar({
  chapters,
  totalCount,
  selectedChapterId,
  selectedChapterTitle,
  selectedChapterHidden,
  searchTerm,
  isOpen,
  onClose,
  onSearchTermChange,
  onSelectChapter,
  onToggleOpen,
}: ChapterSidebarProps) {
  return (
    <>
      <div className="band-story-sidebar__mobile-bar">
        <button
          aria-controls="band-story-chapter-sidebar"
          aria-expanded={isOpen}
          className="band-story-sidebar__toggle"
          onClick={onToggleOpen}
          type="button"
        >
          {isOpen ? "收起章节目录" : "展开章节目录"}
        </button>
      </div>

      <aside
        className={`band-story-sidebar${isOpen ? " band-story-sidebar--open" : ""}`}
        id="band-story-chapter-sidebar"
      >
        <div className="band-story-sidebar__header">
          <div>
            <p>Chapters</p>
            <strong>{chapters.length}</strong>
          </div>
          <span>{totalCount} total</span>
        </div>

        <label className="band-story-sidebar__search" htmlFor="band-story-chapter-search">
          <span>搜索章节</span>
          <input
            id="band-story-chapter-search"
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="按标题、标签或摘要筛选"
            type="search"
            value={searchTerm}
          />
        </label>

        {selectedChapterHidden ? (
          <p className="band-story-sidebar__notice" role="status">
            当前仍显示 `{selectedChapterTitle}`，但它不在筛选结果中。
          </p>
        ) : null}

        {!chapters.length ? (
          <div className="band-story-sidebar__empty">
            <p>没有匹配的章节。</p>
            <button onClick={() => onSearchTermChange("")} type="button">
              清空搜索
            </button>
          </div>
        ) : (
          <div className="band-story-sidebar__list">
            {chapters.map((chapter) => {
              const isActive = chapter.id === selectedChapterId;

              return (
                <button
                  className={`band-story-sidebar__item${
                    isActive ? " band-story-sidebar__item--active" : ""
                  }`}
                  key={chapter.id}
                  onClick={() => {
                    onSelectChapter(chapter.id);
                    onClose();
                  }}
                  type="button"
                >
                  <div className="band-story-sidebar__item-topline">
                    <span className="band-story-sidebar__label">{chapter.label}</span>
                    <span className="band-story-sidebar__status">
                      {chapter.meta.contentStatus === "full" ? "正文已解析" : "仅元信息"}
                    </span>
                  </div>
                  <strong>{chapter.title}</strong>
                  {chapter.summary ? (
                    <p className="band-story-sidebar__summary">{chapter.summary}</p>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </aside>
    </>
  );
}
