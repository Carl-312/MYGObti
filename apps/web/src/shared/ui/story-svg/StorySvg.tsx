import { getCharacterAccent } from "../../../entities/character/model/characterAssets";
import type { CSSProperties, SVGProps } from "react";

type SvgProps = SVGProps<SVGSVGElement> & {
  className?: string;
};

function resolveAccent(characterId?: string, accentColor?: string): string {
  if (accentColor) {
    return accentColor;
  }

  if (!characterId) {
    return "#dab9ff";
  }

  return getCharacterAccent(characterId);
}

export function CharacterIconBadge({
  characterId,
  label,
  accentColor,
  className,
  ...props
}: SvgProps & {
  characterId?: string;
  label?: string;
  accentColor?: string;
}) {
  const accent = resolveAccent(characterId, accentColor);
  const accentSoft = `${accent}33`;
  const mark = label?.slice(0, 1) ?? "?";

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 88 88"
      {...props}
    >
      <circle cx="44" cy="44" fill="#111625" r="40" stroke={accent} strokeWidth="4" />
      <circle cx="30" cy="33" fill={accentSoft} r="10" />
      <circle cx="58" cy="31" fill={accentSoft} r="8" />
      <path
        d="M19 60c7-11 16-17 25-17 10 0 18 6 25 17"
        fill={accentSoft}
        stroke={accent}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <circle cx="32" cy="40" fill="#f3f5ff" r="3.5" />
      <circle cx="56" cy="40" fill="#f3f5ff" r="3.5" />
      <path
        d="M37 52c2.6 2.6 5.2 3.9 7 3.9s4.4-1.3 7-3.9"
        stroke="#f3f5ff"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <circle cx="68" cy="17" fill="#0f1523" r="9" stroke="#7ce8ff" strokeWidth="2" />
      <text
        fill="#f3f5ff"
        fontFamily="Noto Sans CJK SC, Source Han Sans SC, PingFang SC, Microsoft YaHei, sans-serif"
        fontSize="10"
        fontWeight="700"
        x="68"
        y="20.5"
        textAnchor="middle"
      >
        {mark}
      </text>
    </svg>
  );
}

export function SparkleSticker({ className, ...props }: SvgProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 64 64" {...props}>
      <path
        d="M32 6l4.8 14.2L51 25l-14.2 4.8L32 44l-4.8-14.2L13 25l14.2-4.8L32 6z"
        fill="#dab9ff"
        stroke="#0b0f19"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
      <path d="M50 8l1.8 5.2L57 15l-5.2 1.8L50 22l-1.8-5.2L43 15l5.2-1.8L50 8z" fill="#ffafd7" />
      <path d="M13 42l2.2 6.2L21 50l-5.8 2L13 58l-2-6-6-2 6-1.8 2-6.2z" fill="#00dfc1" />
    </svg>
  );
}

export function MusicNoteSticker({ className, ...props }: SvgProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 64 64" {...props}>
      <path
        d="M37 12v24.5a8.5 8.5 0 1 1-3-6.5V18l17-4v19.5a8.5 8.5 0 1 1-3-6.5V10L37 12z"
        fill="#7ce8ff"
        stroke="#0b0f19"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

export function EpisodeSeal({
  className,
  label = "Episode",
  ...props
}: SvgProps & {
  label?: string;
}) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 108 108" {...props}>
      <path
        d="M54 10l10.6 7.2 12.6-.9 5.7 11.2 11.3 5.4-.6 12.6 7.4 10.4-8.4 9.5.6 12.6-11.6 4.6-6.6 10.8-12.5-1.8L54 98l-10.6 7.2-12.6-.9-5.7-11.2-11.3-5.4.6-12.6L7 64.7l8.4-9.5-.6-12.6 11.6-4.6 6.6-10.8 12.5 1.8L54 10z"
        fill="#111625"
        stroke="#ffafd7"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <circle cx="54" cy="54" fill="#0d1320" r="24" stroke="#7ce8ff" strokeWidth="3" />
      <text
        fill="#f3f5ff"
        fontFamily="ZCOOL KuaiLe, Noto Sans CJK SC, Source Han Sans SC, sans-serif"
        fontSize="11"
        fontWeight="700"
        letterSpacing="0.06em"
        textAnchor="middle"
        x="54"
        y="52"
      >
        EP
      </text>
      <text
        fill="#b8c2f5"
        fontFamily="Space Mono, IBM Plex Mono, monospace"
        fontSize="8"
        textAnchor="middle"
        x="54"
        y="65"
      >
        {label.slice(0, 8)}
      </text>
    </svg>
  );
}

export function ComicArrow({
  className,
  direction = "right",
  ...props
}: SvgProps & {
  direction?: "left" | "right";
}) {
  const style = {
    transform: direction === "left" ? "scaleX(-1)" : undefined,
  } as CSSProperties;

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      style={style}
      viewBox="0 0 84 32"
      {...props}
    >
      <path
        d="M4 16h60"
        stroke="currentColor"
        strokeDasharray="6 6"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        d="M48 4l24 12-24 12"
        fill="currentColor"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </svg>
  );
}

export function StoryBadgeIcon({
  className,
  kind = "spark",
  ...props
}: SvgProps & {
  kind?: "spark" | "bubble" | "music" | "ticket";
}) {
  if (kind === "music") {
    return <MusicNoteSticker className={className} viewBox="0 0 64 64" {...props} />;
  }

  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 36 36" {...props}>
      {kind === "bubble" ? (
        <>
          <path
            d="M7 8h22a5 5 0 0 1 5 5v7a5 5 0 0 1-5 5H18l-7 5 1.6-5H7a5 5 0 0 1-5-5v-7a5 5 0 0 1 5-5z"
            fill="currentColor"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="2.4"
          />
          <circle cx="12" cy="16.5" fill="currentColor" opacity="0.48" r="2" />
          <circle cx="18" cy="16.5" fill="currentColor" opacity="0.72" r="2" />
          <circle cx="24" cy="16.5" fill="currentColor" r="2" />
        </>
      ) : kind === "ticket" ? (
        <>
          <path
            d="M5 11a3 3 0 0 0 0 14v0h26v0a3 3 0 0 0 0-14v0H5z"
            fill="currentColor"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="2.4"
          />
          <path d="M18 11v14" stroke="currentColor" strokeDasharray="3 3" strokeWidth="2" />
        </>
      ) : (
        <>
          <path
            d="M18 4l2.9 8.1L29 15l-8.1 2.9L18 26l-2.9-8.1L7 15l8.1-2.9L18 4z"
            fill="currentColor"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="2.4"
          />
          <circle cx="28.5" cy="8.5" fill="currentColor" opacity="0.72" r="3.5" />
        </>
      )}
    </svg>
  );
}
