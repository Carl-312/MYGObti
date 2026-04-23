import type { CSSProperties } from "react";
import {
  getCharacterAccent,
  getCharacterAssetContract,
} from "../model/characterAssets";
import "./character-assets.css";

interface CharacterRoundAvatarProps {
  characterId: string;
  className?: string;
  decorative?: boolean;
  label?: string;
  size?: "sm" | "md" | "lg";
  src?: string | null;
}

export function CharacterRoundAvatar({
  characterId,
  className = "",
  decorative = false,
  label,
  size = "md",
  src,
}: CharacterRoundAvatarProps) {
  const contract = getCharacterAssetContract(characterId, label);
  const resolvedSrc = src ?? contract.roundIcon.src;
  const style = {
    "--avatar-accent": getCharacterAccent(contract.id),
  } as CSSProperties;
  const sizeClass =
    size === "sm"
      ? " character-round-avatar--sm"
      : size === "lg"
        ? " character-round-avatar--lg"
        : "";

  return (
    <span
      aria-hidden={decorative}
      className={`character-round-avatar${sizeClass}${className ? ` ${className}` : ""}`}
      style={style}
    >
      {resolvedSrc ? (
        <img
          alt={decorative ? "" : contract.roundIcon.alt}
          className="character-round-avatar__image"
          src={resolvedSrc}
        />
      ) : (
        <span className="character-round-avatar__fallback">
          {label?.slice(0, 1) ?? contract.fallbackLabel}
        </span>
      )}
    </span>
  );
}
