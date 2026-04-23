import type { RelatedPage } from "../model/types";

interface RelatedPageTabsProps {
  pages: RelatedPage[];
}

export function RelatedPageTabs({ pages }: RelatedPageTabsProps) {
  if (!pages.length) {
    return null;
  }

  return (
    <nav aria-label="Related pages" className="band-story-tabs">
      {pages.map((page) =>
        page.active ? (
          <span
            aria-current="page"
            className="band-story-tabs__item band-story-tabs__item--active"
            key={page.label}
          >
            {page.label}
          </span>
        ) : (
          <a
            className="band-story-tabs__item"
            href={page.href}
            key={page.label}
            rel="noreferrer"
            target={page.href ? "_blank" : undefined}
          >
            {page.label}
          </a>
        ),
      )}
    </nav>
  );
}
