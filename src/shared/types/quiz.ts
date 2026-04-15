export const AXIS_DEFINITIONS = [
  {
    id: "emotionalExpression",
    label: "情感表达",
    lowLabel: "内敛压抑",
    highLabel: "外放爆发",
    description: "区分把情绪往心里吞的人，和会把情绪直接打到脸上的人。",
  },
  {
    id: "socialStrategy",
    label: "社交策略",
    lowLabel: "回避退场",
    highLabel: "主动介入",
    description: "区分先躲开、先观察的人，和会上手处理甚至接管局面的人。",
  },
  {
    id: "selfAwareness",
    label: "自我认知",
    lowLabel: "迷茫被动",
    highLabel: "清醒有主张",
    description: "区分容易被情境卷走的人，和知道自己在做什么的人。",
  },
] as const;

export type AxisId = (typeof AXIS_DEFINITIONS)[number]["id"];
export type AxisVector = [number, number, number];
export type TagCountMap = Record<string, number>;

export interface HiddenTriggerCondition {
  tag: string;
  minCount: number;
}

export interface HiddenCharacterRule {
  description: string;
  requiredTags: HiddenTriggerCondition[];
  minSelfAwareness?: number;
}

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
  summary: string;
  tags: string[];
  relationships: CharacterRelationships;
  result: CharacterResultContent;
  hidden: boolean;
  hiddenRule?: HiddenCharacterRule;
}

export interface QuestionOption {
  id: string;
  text: string;
  delta: AxisVector;
  tags: string[];
  resultNote?: string;
}

export type QuestionOptionSet = [QuestionOption, QuestionOption, QuestionOption, QuestionOption];

export interface Question {
  id: string;
  order: number;
  category: string;
  prompt: string;
  sceneHint: string;
  tags: string[];
  options: QuestionOptionSet;
}

export interface QuizAnswerRecord {
  questionId: string;
  optionId: string;
  delta: AxisVector;
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
  decisiveAxis: AxisId;
  winnerId: string;
  runnerUpId: string;
  reason: string;
}

export interface HiddenMatchResult {
  id: string;
  name: string;
  title: string;
  triggered: boolean;
  matchedTags: string[];
  missingTags: string[];
  description: string;
}

export interface MatchComputation {
  vector: AxisVector;
  ranking: MatchResult[];
  tieBreak: TieBreakDecision | null;
  hiddenMatch: HiddenMatchResult | null;
  tagCounts: TagCountMap;
}
