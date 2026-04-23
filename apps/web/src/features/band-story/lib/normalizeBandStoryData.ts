import type {
  BandStoryData,
  DialogueGroup,
  DialogueGroupKind,
  DialogueLine,
  RelatedPage,
  StoryCharacterIdentity,
  StoryChapter,
  StoryChapterMeta,
  StoryScene,
  StorySceneType,
} from "../model/types";

const BANNED_TEXT_PATTERNS = [
  /advertisement/i,
  /sponsored by/i,
  /fandom/i,
  /follow us/i,
  /recent images/i,
  /^edit$/i,
  /^comments?$/i,
];

function cleanText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
}

function hasContentText(value: string): boolean {
  if (!value) {
    return false;
  }

  return !BANNED_TEXT_PATTERNS.some((pattern) => pattern.test(value));
}

function toSlug(value: string, fallback: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

function buildAvatarLabel(speaker: string): string {
  const compact = speaker.replace(/\s+/g, "");

  if (compact.length <= 2) {
    return compact || "NA";
  }

  return compact.slice(0, 2).toUpperCase();
}

function dedupeStrings(values: string[]): string[] {
  return values.filter(
    (value, index) => hasContentText(value) && values.indexOf(value) === index,
  );
}

function readRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return dedupeStrings(value.map((item) => cleanText(item)).filter(hasContentText));
}

function normalizeRelatedPage(value: unknown): RelatedPage | null {
  const record = readRecord(value);
  const label = cleanText(record.label);

  if (!hasContentText(label)) {
    return null;
  }

  const href = cleanText(record.href);

  return {
    label,
    href: href || undefined,
    active: Boolean(record.active),
  };
}

function normalizeCharacterIdentity(
  value: unknown,
  speaker: string,
): StoryCharacterIdentity | undefined {
  const record = readRecord(value);
  const label = cleanText(record.label) || speaker;

  if (!hasContentText(label)) {
    return undefined;
  }

  const avatarLabel = cleanText(record.avatarLabel) || buildAvatarLabel(label);
  const identity: StoryCharacterIdentity = {
    key: cleanText(record.key) || toSlug(label, "unknown-character"),
    label,
    avatarLabel,
  };

  const characterHref = cleanText(record.characterHref);
  const imageAlt = cleanText(record.imageAlt);
  const imageName = cleanText(record.imageName);
  const imageKey = cleanText(record.imageKey);
  const imageHref = cleanText(record.imageHref);

  if (characterHref) {
    identity.characterHref = characterHref;
  }
  if (imageAlt) {
    identity.imageAlt = imageAlt;
  }
  if (imageName) {
    identity.imageName = imageName;
  }
  if (imageKey) {
    identity.imageKey = imageKey;
  }
  if (imageHref) {
    identity.imageHref = imageHref;
  }

  return identity;
}

function createDialogueLineNormalizer(chapterId: string) {
  let lineIndex = 0;

  return function normalizeDialogueLine(value: unknown): DialogueLine | null {
    const record = readRecord(value);
    const text = cleanText(record.text);

    if (!hasContentText(text)) {
      return null;
    }

    const rawSpeaker = cleanText(record.speaker);
    const character = normalizeCharacterIdentity(record.character, rawSpeaker);
    const speaker = rawSpeaker || character?.label || "Narration";

    lineIndex += 1;

    return {
      id: `${chapterId}-line-${String(lineIndex).padStart(3, "0")}`,
      speaker,
      speakerKey: cleanText(record.speakerKey) || toSlug(speaker, "narration"),
      text,
      avatarLabel:
        cleanText(record.avatarLabel) ||
        character?.avatarLabel ||
        buildAvatarLabel(speaker),
      isThought:
        Boolean(record.isThought) || /^\(.*\)$/.test(text),
      character,
    };
  };
}

function normalizeDialogueGroupKind(value: unknown): DialogueGroupKind {
  const kind = cleanText(value);

  if (kind === "flashback" || kind === "scene-dialogue" || kind === "inner-monologue") {
    return kind;
  }

  return "scene-dialogue";
}

function normalizeSceneType(value: unknown): StorySceneType {
  const sceneType = cleanText(value);

  return sceneType === "flashback" ? "flashback" : "scene";
}

function normalizeDialogueGroup(
  value: unknown,
  index: number,
  fallbackSceneId: string,
  normalizeLine: (value: unknown) => DialogueLine | null,
): DialogueGroup | null {
  const record = readRecord(value);
  const normalizedSpeakers = normalizeStringArray(record.speakers);
  const lines = Array.isArray(record.lines)
    ? record.lines
        .map(normalizeLine)
        .filter((line): line is DialogueLine => line !== null)
    : [];

  if (!lines.length) {
    return null;
  }

  const sceneId = cleanText(record.sceneId) || fallbackSceneId;
  const title = cleanText(record.title) || `Dialogue block ${String(index + 1).padStart(2, "0")}`;
  const emphasis = cleanText(record.emphasis);

  return {
    id: cleanText(record.id) || `${sceneId}-group-${String(index + 1).padStart(2, "0")}`,
    sceneId,
    title,
    kind: normalizeDialogueGroupKind(record.kind),
    lineCount: Number(record.lineCount) || lines.length,
    speakers:
      normalizedSpeakers.length > 0
        ? normalizedSpeakers
        : dedupeStrings(lines.map((line) => line.speaker)),
    emphasis: emphasis || undefined,
    lines,
  };
}

function normalizeStoryScene(value: unknown, index: number, chapterId: string): StoryScene {
  const record = readRecord(value);
  const marker = cleanText(record.marker);
  const title =
    cleanText(record.title) || marker || `Scene ${String(index + 1).padStart(2, "0")}`;

  return {
    id: cleanText(record.id) || `${chapterId}-scene-${String(index + 1).padStart(2, "0")}`,
    title,
    sceneType: normalizeSceneType(record.sceneType),
    marker: marker || undefined,
    lineCount: Number(record.lineCount) || 0,
    dialogueGroupIds: normalizeStringArray(record.dialogueGroupIds),
  };
}

function normalizeChapterMeta(
  value: unknown,
  index: number,
  {
    lineCount,
    sceneCount,
    dialogueGroupCount,
    speakers,
  }: {
    lineCount: number;
    sceneCount: number;
    dialogueGroupCount: number;
    speakers: string[];
  },
): StoryChapterMeta {
  const record = readRecord(value);
  const normalizedSpeakers = normalizeStringArray(record.speakers);
  const contentStatus = cleanText(record.contentStatus) === "full" ? "full" : "meta-only";
  const previewImageAlt = cleanText(record.previewImageAlt);
  const previewImageName = cleanText(record.previewImageName);
  const previewImageKey = cleanText(record.previewImageKey);
  const previewImageHref = cleanText(record.previewImageHref);

  return {
    chapterNumber: Number(record.chapterNumber) || index + 1,
    contentStatus: lineCount > 0 ? "full" : contentStatus,
    previewImageAlt: previewImageAlt || undefined,
    previewImageName: previewImageName || undefined,
    previewImageKey: previewImageKey || undefined,
    previewImageHref: previewImageHref || undefined,
    lineCount: Number(record.lineCount) || lineCount,
    sceneCount: Number(record.sceneCount) || sceneCount,
    dialogueGroupCount: Number(record.dialogueGroupCount) || dialogueGroupCount,
    speakerCount: Number(record.speakerCount) || speakers.length,
    speakers: normalizedSpeakers.length > 0 ? normalizedSpeakers : speakers,
  };
}

function normalizeStoryChapter(value: unknown, index: number): StoryChapter {
  const record = readRecord(value);
  const id = cleanText(record.id) || `chapter-${String(index + 1).padStart(2, "0")}`;
  const label =
    cleanText(record.label) || `Chapter ${String(index + 1).padStart(2, "0")}`;
  const title = cleanText(record.title) || label;
  const summary = cleanText(record.summary);
  const sceneMarkers = normalizeStringArray(record.sceneMarkers);
  const fallbackSceneId = `${id}-scene-01`;
  const normalizeLine = createDialogueLineNormalizer(id);
  const dialogueGroups = Array.isArray(record.dialogueGroups)
    ? record.dialogueGroups
        .map((group, groupIndex) =>
          normalizeDialogueGroup(group, groupIndex, fallbackSceneId, normalizeLine),
        )
        .filter((group): group is DialogueGroup => group !== null)
    : [];
  const dialogues =
    dialogueGroups.length > 0
      ? dialogueGroups.flatMap((group) => group.lines)
      : Array.isArray(record.dialogues)
        ? record.dialogues
            .map(normalizeLine)
            .filter((line): line is DialogueLine => line !== null)
        : [];
  const scenes = Array.isArray(record.scenes)
    ? record.scenes.map((scene, sceneIndex) => normalizeStoryScene(scene, sceneIndex, id))
    : [];
  const normalizedSpeakers = dedupeStrings(dialogues.map((line) => line.speaker));
  const meta = normalizeChapterMeta(record.meta, index, {
    lineCount: dialogues.length,
    sceneCount: scenes.length,
    dialogueGroupCount: dialogueGroups.length,
    speakers: normalizedSpeakers,
  });

  return {
    id,
    label,
    title,
    summary: summary || undefined,
    sceneMarkers:
      sceneMarkers.length > 0
        ? sceneMarkers
        : dedupeStrings(
            scenes
              .map((scene) => scene.marker ?? "")
              .filter((marker) => hasContentText(marker)),
          ),
    meta,
    scenes,
    dialogueGroups,
    dialogues,
  };
}

export function normalizeBandStoryData(value: unknown): BandStoryData {
  const record = readRecord(value);
  const sourceFile = cleanText(record.sourceFile);
  const title = cleanText(record.title) || "Band Story";
  const subtitle = cleanText(record.subtitle);
  const intro = cleanText(record.intro);
  const relatedPages = Array.isArray(record.relatedPages)
    ? record.relatedPages
        .map(normalizeRelatedPage)
        .filter((page): page is RelatedPage => page !== null)
    : [];
  const chapters = Array.isArray(record.chapters)
    ? record.chapters.map(normalizeStoryChapter)
    : [];

  return {
    sourceFile,
    title,
    subtitle: subtitle || undefined,
    intro: intro || undefined,
    relatedPages,
    chapters,
  };
}
