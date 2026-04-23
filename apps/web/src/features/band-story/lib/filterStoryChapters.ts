import type { StoryChapter } from "../model/types";

function normalizeSearchTerm(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function filterStoryChapters(
  chapters: StoryChapter[],
  query: string,
): StoryChapter[] {
  const normalizedQuery = normalizeSearchTerm(query);

  if (!normalizedQuery) {
    return chapters;
  }

  return chapters.filter((chapter) => {
    const haystack = [
      chapter.label,
      chapter.title,
      chapter.summary ?? "",
    ]
      .join(" ")
      .toLocaleLowerCase();

    return haystack.includes(normalizedQuery);
  });
}
