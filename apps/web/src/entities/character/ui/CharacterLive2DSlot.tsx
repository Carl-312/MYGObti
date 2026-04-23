import type { CSSProperties } from "react";
import {
  getCharacterAccent,
  getCharacterAssetContract,
} from "../model/characterAssets";
import "./character-assets.css";

interface CharacterLive2DSlotProps {
  characterId: string;
  className?: string;
  decorative?: boolean;
  label?: string;
}

export function CharacterLive2DSlot({
  characterId,
  className = "",
  decorative = false,
  label,
}: CharacterLive2DSlotProps) {
  const contract = getCharacterAssetContract(characterId, label);
  const style = {
    "--slot-accent": getCharacterAccent(contract.id),
  } as CSSProperties;

  return (
    <div
      className={`character-live2d-slot${className ? ` ${className}` : ""}`}
      style={style}
    >
      {contract.live2d.src ? (
        <img
          alt={decorative ? "" : contract.live2d.alt}
          className="character-live2d-slot__image"
          src={contract.live2d.src}
        />
      ) : (
        <div className="character-live2d-slot__placeholder">
          <strong>{label ?? contract.name}</strong>
          <span>Live2D slot placeholder</span>
        </div>
      )}
    </div>
  );
}
