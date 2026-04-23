export const AXIS_DEFINITIONS = [
  {
    id: "emotionExpression",
    label: "情感表达",
    lowLabel: "内敛压抑",
    highLabel: "外放表达",
    description: "区分把情绪往心里吞的人，和会把情绪直接说出来的人。",
  },
  {
    id: "socialStrategy",
    label: "社交策略",
    lowLabel: "回避等待",
    highLabel: "主动介入",
    description: "区分先躲开、先观察的人，和会上手处理甚至接管局面的人。",
  },
  {
    id: "selfRecognition",
    label: "自我认知",
    lowLabel: "迷茫被动",
    highLabel: "清醒有主张",
    description: "区分容易被情境卷走的人，和知道自己想守什么的人。",
  },
] as const;

export type AxisId = (typeof AXIS_DEFINITIONS)[number]["id"];
export type AxisVector = [number, number, number];
export type TagCountMap = Record<string, number>;
export type QuestionType = "scored" | "latent" | "reverse_check";

export interface CharacterRelationships {
  rivalId: string;
  soulmateId: string;
}

export interface CharacterResultContent {
  description: string;
  shortReview: string;
  quote: string;
  posterCaption: string;
  highlights: string[];
}

export interface CharacterProfile {
  id: string;
  name: string;
  title: string;
  anchor: AxisVector;
  latentAnchor: number;
  summary: string;
  tags: string[];
  relationships: CharacterRelationships;
  result: CharacterResultContent;
  hidden: boolean;
}

export interface QuestionOption {
  id: string;
  text: string;
  delta: AxisVector;
  latentDelta?: number;
  tags: string[];
  resultNote?: string;
}

export type QuestionOptionSet = [
  QuestionOption,
  QuestionOption,
  QuestionOption,
  QuestionOption,
];

export interface Question {
  id: string;
  order: number;
  qtype: QuestionType;
  category: string;
  prompt: string;
  sceneHint: string;
  primaryAxis?: AxisId;
  latentTrait?: string;
  tags: string[];
  options: QuestionOptionSet;
}

export interface QuizAnswerRecord {
  questionId: string;
  questionType: QuestionType;
  optionId: string;
  delta: AxisVector;
  latentDelta?: number;
  tags: string[];
}

export interface AxisScoreBreakdown {
  axisId: AxisId;
  label: string;
  userValue: number;
  anchorValue: number;
  distance: number;
}

export interface MatchResult {
  id: string;
  name: string;
  title: string;
  score: number;
  anchor: AxisVector;
  summary: string;
  tags: string[];
  relationships: CharacterRelationships;
  result: CharacterResultContent;
  axisBreakdown: AxisScoreBreakdown[];
}

export interface TieBreakDecision {
  threshold: number;
  scoreGap: number;
  primaryTrait: string;
  lambda: number;
  winnerId: string;
  runnerUpId: string;
  winnerName: string;
  runnerUpName: string;
  reason: string;
}

export interface HiddenMatchResult {
  id: string;
  name: string;
  title: string;
  triggered: boolean;
  matchedTags: string[];
  description: string;
  score: number;
}

export interface MatchComputation {
  vector: AxisVector;
  latentScore: number;
  ranking: MatchResult[];
  tieBreak: TieBreakDecision | null;
  hiddenMatch: HiddenMatchResult | null;
  tagCounts: TagCountMap;
  responseInconsistency: boolean;
}

export interface QuizMeta {
  note: string;
  tieBreakerRule: {
    enabledWhenTop2DiffBelow: number;
    onlyWhenTop2IncludesAnyOf: string[];
    primaryTrait: string;
    lambda: {
      default: number;
      priorityPair: number;
    };
    priorityPairs: string[][];
  };
}

export interface CanonicalCharacterContent {
  name: string;
  title: string;
  anchor: AxisVector;
  latentAnchor: number;
  description: string;
  hidden: boolean;
}

export interface QuizContentCounts {
  questions: number;
  characters: number;
  publicCharacters: number;
  hiddenCharacters: number;
}

export interface QuizMetaResponse {
  version: string;
  sourcePath: string;
  note: string;
  tieBreakerRule: QuizMeta["tieBreakerRule"];
  counts: QuizContentCounts;
}

export interface QuizContentSnapshot {
  version: string;
  sourcePath: string;
  meta: Record<string, unknown>;
  quizMeta: QuizMeta;
  questions: Question[];
  characters: CanonicalCharacterContent[];
  counts: QuizContentCounts;
}
