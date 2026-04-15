import { cosineSimilarity } from "../lib/cosineSimilarity";
import {
  AXIS_DEFINITIONS,
  type AxisScoreBreakdown,
  type AxisVector,
  type CharacterProfile,
  type HiddenMatchResult,
  type MatchComputation,
  type MatchResult,
  type QuizAnswerRecord,
  type TagCountMap,
  type TieBreakDecision,
} from "../../../shared/types/quiz";

export const MATCH_TIE_BREAK_THRESHOLD = 0.08;

export function createEmptyVector(): AxisVector {
  return [0, 0, 0];
}

export function sumVectors(vectors: AxisVector[]): AxisVector {
  return vectors.reduce<AxisVector>(
    (accumulator, current) => [
      accumulator[0] + current[0],
      accumulator[1] + current[1],
      accumulator[2] + current[2],
    ],
    createEmptyVector(),
  );
}

export function buildQuizVector(answers: QuizAnswerRecord[]): AxisVector {
  return sumVectors(answers.map((answer) => answer.delta));
}

export function countAnswerTags(answers: QuizAnswerRecord[]): TagCountMap {
  return answers.reduce<TagCountMap>((counts, answer) => {
    answer.tags.forEach((tag) => {
      counts[tag] = (counts[tag] ?? 0) + 1;
    });
    return counts;
  }, {});
}

export function rankPublicMatches(
  userVector: AxisVector,
  profiles: CharacterProfile[],
): MatchResult[] {
  return profiles
    .filter((profile) => !profile.hidden)
    .map((profile) => createMatchResult(profile, userVector))
    .sort(compareMatches);
}

export function resolveTieBreak(
  userVector: AxisVector,
  ranking: MatchResult[],
): { ranking: MatchResult[]; tieBreak: TieBreakDecision | null } {
  if (ranking.length < 2) {
    return { ranking, tieBreak: null };
  }

  const [first, second, ...rest] = ranking;
  const scoreGap = first.score - second.score;

  if (scoreGap >= MATCH_TIE_BREAK_THRESHOLD) {
    return { ranking, tieBreak: null };
  }

  const decisiveAxisIndex = findLargestAxisGap(first.anchor, second.anchor);
  const decisiveAxis = AXIS_DEFINITIONS[decisiveAxisIndex];
  const firstDistance = first.axisBreakdown[decisiveAxisIndex].distance;
  const secondDistance = second.axisBreakdown[decisiveAxisIndex].distance;

  const tieBreakWinner =
    secondDistance < firstDistance
      ? second
      : firstDistance < secondDistance
        ? first
        : compareMatches(first, second) <= 0
          ? first
          : second;
  const tieBreakRunnerUp = tieBreakWinner.id === first.id ? second : first;
  const adjustedRanking =
    tieBreakWinner.id === first.id ? ranking : [tieBreakWinner, tieBreakRunnerUp, ...rest];

  return {
    ranking: adjustedRanking,
    tieBreak: {
      threshold: MATCH_TIE_BREAK_THRESHOLD,
      scoreGap,
      decisiveAxis: decisiveAxis.id,
      winnerId: tieBreakWinner.id,
      runnerUpId: tieBreakRunnerUp.id,
      reason: `Top 2 scores were within ${MATCH_TIE_BREAK_THRESHOLD.toFixed(2)}, so ${decisiveAxis.label} was used as the deciding axis.`,
    },
  };
}

export function matchCharacters(
  userVector: AxisVector,
  profiles: CharacterProfile[],
): MatchResult[] {
  return resolveTieBreak(userVector, rankPublicMatches(userVector, profiles)).ranking;
}

export function evaluateHiddenCharacter(
  userVector: AxisVector,
  profiles: CharacterProfile[],
  tagCounts: TagCountMap,
): HiddenMatchResult | null {
  const matches = profiles
    .filter((profile) => profile.hidden && profile.hiddenRule)
    .map((profile) => {
      const rule = profile.hiddenRule!;
      const matchedTags = rule.requiredTags
        .filter((condition) => (tagCounts[condition.tag] ?? 0) >= condition.minCount)
        .map((condition) => condition.tag);
      const missingTags = rule.requiredTags
        .filter((condition) => (tagCounts[condition.tag] ?? 0) < condition.minCount)
        .map((condition) => condition.tag);
      const meetsSelfAwareness =
        rule.minSelfAwareness === undefined || userVector[2] >= rule.minSelfAwareness;

      return {
        profile,
        matchedTags,
        missingTags,
        score: cosineSimilarity(userVector, profile.anchor),
        triggered: meetsSelfAwareness && missingTags.length === 0,
      };
    })
    .filter((candidate) => candidate.triggered)
    .sort((left, right) => right.score - left.score);

  if (matches.length === 0) {
    return null;
  }

  const winner = matches[0];

  return {
    id: winner.profile.id,
    name: winner.profile.name,
    title: winner.profile.title,
    triggered: true,
    matchedTags: winner.matchedTags,
    missingTags: winner.missingTags,
    description: winner.profile.hiddenRule!.description,
  };
}

export function evaluateQuizResult(input: {
  profiles: CharacterProfile[];
  answers?: QuizAnswerRecord[];
  userVector?: AxisVector;
}): MatchComputation {
  const answers = input.answers ?? [];
  const vector = input.userVector ?? buildQuizVector(answers);
  const tagCounts = countAnswerTags(answers);
  const ranked = rankPublicMatches(vector, input.profiles);
  const { ranking, tieBreak } = resolveTieBreak(vector, ranked);

  return {
    vector,
    ranking,
    tieBreak,
    hiddenMatch: evaluateHiddenCharacter(vector, input.profiles, tagCounts),
    tagCounts,
  };
}

function createMatchResult(profile: CharacterProfile, userVector: AxisVector): MatchResult {
  return {
    id: profile.id,
    name: profile.name,
    title: profile.title,
    score: cosineSimilarity(userVector, profile.anchor),
    anchor: profile.anchor,
    summary: profile.summary,
    tags: profile.tags,
    relationships: profile.relationships,
    result: profile.result,
    axisBreakdown: createAxisBreakdown(userVector, profile.anchor),
  };
}

function createAxisBreakdown(
  userVector: AxisVector,
  anchor: AxisVector,
): AxisScoreBreakdown[] {
  return AXIS_DEFINITIONS.map((axis, index) => ({
    axisId: axis.id,
    label: axis.label,
    userValue: userVector[index],
    anchorValue: anchor[index],
    distance: Math.abs(userVector[index] - anchor[index]),
  }));
}

function compareMatches(left: MatchResult, right: MatchResult): number {
  if (left.score !== right.score) {
    return right.score - left.score;
  }

  return left.id.localeCompare(right.id);
}

function findLargestAxisGap(left: AxisVector, right: AxisVector): number {
  const gaps = left.map((value, index) => Math.abs(value - right[index]));
  return gaps.indexOf(Math.max(...gaps));
}
