import type { CharacterProfile } from "@mygobti/quiz-core";
import live2dManifest from "../../../../public/live2d/manifest.json";
import roundIconManifest from "../../../../public/round-icons/manifest.json";

interface RoundIconManifestEntry {
  id: string;
  name: string;
  alias: string | null;
  localPng: string;
  localSvg: string;
}

interface Live2DManifestEntry {
  id: string;
  name: string;
  localFile: string;
}

export const CHARACTER_ACCENTS: Record<string, string> = {
  tomori: "#6fa8ff",
  anon: "#ff8d86",
  taki: "#ffd45a",
  soyo: "#8be0c1",
  raana: "#8c80ff",
  mutsumi: "#76d7d5",
  sakiko: "#ffb6ca",
  uika: "#ffb05f",
};

const CHARACTER_ID_ALIASES: Record<string, string> = {
  rana: "raana",
  raana: "raana",
  uhika: "uika",
  uika: "uika",
};

const roundIcons = roundIconManifest as RoundIconManifestEntry[];
const live2dImages = live2dManifest as Live2DManifestEntry[];
const roundIconById = new Map(roundIcons.map((entry) => [entry.id, entry] as const));
const live2dById = new Map(live2dImages.map((entry) => [entry.id, entry] as const));
const manifestIds = new Set([
  ...roundIcons.map((entry) => entry.id),
  ...live2dImages.map((entry) => entry.id),
]);

export const CHARACTER_ASSET_IDS = [...manifestIds];

export interface CharacterAssetImage {
  src: string | null;
  alt: string;
  status: "ready" | "placeholder";
}

export interface CharacterAssetContract {
  requestedId: string;
  id: string;
  name: string;
  alias: string | null;
  accentColor: string;
  fallbackLabel: string;
  roundIcon: CharacterAssetImage & {
    pngSrc: string | null;
    svgSrc: string | null;
  };
  live2d: CharacterAssetImage;
}

function toPublicSrc(path: string | undefined): string | null {
  if (!path) {
    return null;
  }

  return path.startsWith("/") ? path : `/${path}`;
}

function toFallbackLabel(name: string, alias: string | null, characterId: string): string {
  if (alias) {
    return alias.slice(0, 1).toUpperCase();
  }

  if (name) {
    return name.slice(0, 1);
  }

  return characterId.slice(0, 1).toUpperCase();
}

export function normalizeCharacterAssetId(characterId: string): string {
  return CHARACTER_ID_ALIASES[characterId] ?? characterId;
}

export function getCharacterAccent(characterId: string): string {
  return CHARACTER_ACCENTS[normalizeCharacterAssetId(characterId)] ?? "#ff8d86";
}

export function getCharacterAssetContract(
  characterId: string,
  fallbackName?: string,
): CharacterAssetContract {
  const normalizedId = normalizeCharacterAssetId(characterId);
  const roundIcon = roundIconById.get(normalizedId);
  const live2d = live2dById.get(normalizedId);
  const name = roundIcon?.name ?? live2d?.name ?? fallbackName ?? normalizedId;
  const alias = roundIcon?.alias ?? null;
  const fallbackLabel = toFallbackLabel(name, alias, normalizedId);
  const roundPngSrc = toPublicSrc(roundIcon?.localPng);
  const roundSvgSrc = toPublicSrc(roundIcon?.localSvg);
  const live2dSrc = toPublicSrc(live2d?.localFile);

  return {
    requestedId: characterId,
    id: normalizedId,
    name,
    alias,
    accentColor: getCharacterAccent(normalizedId),
    fallbackLabel,
    roundIcon: {
      pngSrc: roundPngSrc,
      svgSrc: roundSvgSrc,
      src: roundPngSrc ?? roundSvgSrc,
      alt: `${name} 圆形头像`,
      status: roundPngSrc || roundSvgSrc ? "ready" : "placeholder",
    },
    live2d: {
      src: live2dSrc,
      alt: `${name} Live2D 静态图`,
      status: live2dSrc ? "ready" : "placeholder",
    },
  };
}

export function getCharacterAssetContracts(
  characterIds: string[],
): CharacterAssetContract[] {
  return characterIds.map((characterId) => getCharacterAssetContract(characterId));
}

export function getAllCharacterAssetContracts(): CharacterAssetContract[] {
  return CHARACTER_ASSET_IDS.map((characterId) => getCharacterAssetContract(characterId));
}

export function getCharacterAssetContractFromProfile(
  profile: Pick<CharacterProfile, "id" | "name">,
): CharacterAssetContract {
  return getCharacterAssetContract(profile.id, profile.name);
}
