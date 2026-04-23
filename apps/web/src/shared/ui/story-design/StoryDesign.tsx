import type { CSSProperties, ReactNode } from "react";
import {
  CharacterIconBadge,
  ComicArrow,
  EpisodeSeal,
  SparkleSticker,
  StoryBadgeIcon,
} from "../story-svg";
import "./story-design.css";

export interface StorySectionFrameProps {
  kicker?: string;
  title: string;
  summary?: string;
  badge?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export interface StoryFactItem {
  label: string;
  value: string;
  detail?: string;
}

export interface StoryMetricItem {
  label: string;
  value: string;
}

export interface DialogueLine {
  speaker: string;
  text: string;
  role?: "primary" | "secondary" | "echo";
  avatarLabel?: string;
  avatarSrc?: string;
  avatarIcon?: string;
}

export interface DialogueSceneCardProps {
  scene: string;
  title: string;
  note?: string;
  lines: DialogueLine[];
  accentColor?: string;
}

export interface CharacterSpotlightItem {
  name: string;
  title: string;
  description?: string;
  avatarSrc?: string;
  iconId?: string;
  accentColor?: string;
  badge?: string;
}

export interface StoryGalleryItem {
  title: string;
  description?: string;
  imageSrc?: string;
  eyebrow?: string;
  tone?: string;
}

export function StorySectionFrame({
  kicker,
  title,
  summary,
  badge,
  actions,
  children,
}: StorySectionFrameProps) {
  return (
    <section className="story-design-section">
      <div className="story-design-section__decor" aria-hidden="true">
        <SparkleSticker className="story-design-section__sparkle" />
        <EpisodeSeal className="story-design-section__seal" label={badge ?? "Story"} />
      </div>
      <header className="story-design-section__header">
        <div className="story-design-section__copy">
          {kicker ? (
            <p className="story-design-kicker">
              <StoryBadgeIcon kind="ticket" />
              <span>{kicker}</span>
            </p>
          ) : null}
          <h2>{title}</h2>
          {summary ? <p className="story-design-section__summary">{summary}</p> : null}
        </div>
        {badge || actions ? (
          <div className="story-design-section__meta">
            {badge ? <span className="story-design-badge">{badge}</span> : null}
            {actions}
          </div>
        ) : null}
      </header>
      {children}
    </section>
  );
}

export function StoryFactGrid({ items }: { items: StoryFactItem[] }) {
  return (
    <div className="story-design-fact-grid">
      {items.map((item) => (
        <article className="story-design-fact-card" key={`${item.label}-${item.value}`}>
          <p className="story-design-fact-card__label">{item.label}</p>
          <strong>{item.value}</strong>
          {item.detail ? <p className="story-design-fact-card__detail">{item.detail}</p> : null}
        </article>
      ))}
    </div>
  );
}

export function StoryMetricStrip({ items }: { items: StoryMetricItem[] }) {
  return (
    <div className="story-design-metric-strip" role="list">
      {items.map((item) => (
        <div className="story-design-metric" key={`${item.label}-${item.value}`} role="listitem">
          <StoryBadgeIcon kind="spark" />
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function DialogueSceneCard({
  scene,
  title,
  note,
  lines,
  accentColor = "#f36b4f",
}: DialogueSceneCardProps) {
  const style = { "--story-accent": accentColor } as CSSProperties;

  return (
    <article className="story-design-scene" style={style}>
      <header className="story-design-scene__header">
        <p className="story-design-kicker">
          <StoryBadgeIcon kind="bubble" />
          <span>{scene}</span>
        </p>
        <h3>{title}</h3>
        {note ? <p className="story-design-scene__note">{note}</p> : null}
      </header>

      <div className="story-design-scene__lines">
        {lines.map((line, index) => (
          <div
            className={`story-design-line story-design-line--${line.role ?? "primary"}`}
            key={`${line.speaker}-${index}`}
          >
            <div className="story-design-line__avatar" aria-hidden="true">
              {line.avatarSrc ? (
                <img alt="" src={line.avatarSrc} />
              ) : line.avatarIcon ? (
                <CharacterIconBadge
                  accentColor={accentColor}
                  characterId={line.avatarIcon}
                  label={line.avatarLabel ?? line.speaker}
                />
              ) : (
                <span>{line.avatarLabel ?? line.speaker.slice(0, 1)}</span>
              )}
            </div>
            <div className="story-design-line__bubble">
              <strong>{line.speaker}</strong>
              <p>{line.text}</p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

export function CharacterSpotlightRail({
  items,
}: {
  items: CharacterSpotlightItem[];
}) {
  return (
    <div className="story-design-spotlight-rail">
      {items.map((item) => (
        <article className="story-design-spotlight-card" key={item.name}>
          <div className="story-design-spotlight-card__avatar" aria-hidden="true">
            {item.avatarSrc ? (
              <img alt="" src={item.avatarSrc} />
            ) : (
              <CharacterIconBadge
                accentColor={item.accentColor}
                characterId={item.iconId ?? item.name}
                label={item.name}
              />
            )}
          </div>
          <div className="story-design-spotlight-card__copy">
            <div className="story-design-spotlight-card__headline">
              <strong>{item.name}</strong>
              {item.badge ? <span>{item.badge}</span> : null}
            </div>
            <p className="story-design-spotlight-card__title">{item.title}</p>
            {item.description ? <p>{item.description}</p> : null}
          </div>
        </article>
      ))}
    </div>
  );
}

export function StoryGalleryGrid({ items }: { items: StoryGalleryItem[] }) {
  return (
    <div className="story-design-gallery-grid">
      {items.map((item) => (
        <article
          className={`story-design-gallery-card${item.tone ? ` story-design-gallery-card--${item.tone}` : ""}`}
          key={item.title}
        >
          <div className="story-design-gallery-card__media" aria-hidden="true">
            {item.imageSrc ? (
              <img alt="" src={item.imageSrc} />
            ) : (
              <>
                <ComicArrow className="story-design-gallery-card__arrow" direction="right" />
                <StoryBadgeIcon kind="music" />
                <span>{item.title}</span>
              </>
            )}
          </div>
          <div className="story-design-gallery-card__copy">
            {item.eyebrow ? (
              <p className="story-design-kicker">
                <StoryBadgeIcon kind="spark" />
                <span>{item.eyebrow}</span>
              </p>
            ) : null}
            <h3>{item.title}</h3>
            {item.description ? <p>{item.description}</p> : null}
          </div>
        </article>
      ))}
    </div>
  );
}
