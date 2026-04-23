export interface RelatedPage {
  label: string;
  href?: string;
  active: boolean;
}

export interface StoryCharacterIdentity {
  key: string;
  label: string;
  avatarLabel: string;
  characterHref?: string;
  imageAlt?: string;
  imageName?: string;
  imageKey?: string;
  imageHref?: string;
}

export interface DialogueLine {
  id: string;
  speaker: string;
  speakerKey: string;
  text: string;
  avatarLabel: string;
  isThought: boolean;
  character?: StoryCharacterIdentity;
}

export type DialogueGroupKind =
  | "flashback"
  | "scene-dialogue"
  | "inner-monologue";

export interface DialogueGroup {
  id: string;
  sceneId: string;
  title: string;
  kind: DialogueGroupKind;
  lineCount: number;
  speakers: string[];
  emphasis?: string;
  lines: DialogueLine[];
}

export type StorySceneType = "flashback" | "scene";

export interface StoryScene {
  id: string;
  title: string;
  sceneType: StorySceneType;
  marker?: string;
  lineCount: number;
  dialogueGroupIds: string[];
}

export type ChapterContentStatus = "full" | "meta-only";

export interface StoryChapterMeta {
  chapterNumber: number;
  contentStatus: ChapterContentStatus;
  previewImageAlt?: string;
  previewImageName?: string;
  previewImageKey?: string;
  previewImageHref?: string;
  lineCount: number;
  sceneCount: number;
  dialogueGroupCount: number;
  speakerCount: number;
  speakers: string[];
}

export interface StoryChapter {
  id: string;
  label: string;
  title: string;
  summary?: string;
  sceneMarkers: string[];
  meta: StoryChapterMeta;
  scenes: StoryScene[];
  dialogueGroups: DialogueGroup[];
  dialogues: DialogueLine[];
}

export interface BandStoryData {
  sourceFile: string;
  title: string;
  subtitle?: string;
  intro?: string;
  relatedPages: RelatedPage[];
  chapters: StoryChapter[];
}
