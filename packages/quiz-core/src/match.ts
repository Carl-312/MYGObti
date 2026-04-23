import { cosineSimilarity } from "./cosineSimilarity";
import {
  AXIS_DEFINITIONS,
  type AxisScoreBreakdown,
  type AxisVector,
  type CharacterProfile,
  type HiddenMatchResult,
  type MatchComputation,
  type MatchResult,
  type QuizAnswerRecord,
  type QuizMeta,
  type TagCountMap,
  type TieBreakDecision,
} from "./quiz";

interface EvaluateQuizResultInput {
  profiles: CharacterProfile[];
  tieBreakerRule: QuizMeta["tieBreakerRule"];
  answers?: QuizAnswerRecord[];
  userVector?: AxisVector;
}

interface RankedMatchEntry {
  profile: CharacterProfile;
  match: MatchResult;
}

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
  return sumVectors(
    answers
      .filter((answer) => answer.questionType !== "latent")
      .map((answer) => answer.delta),
  );
}

export function buildLatentScore(answers: QuizAnswerRecord[]): number {
  const values = answers
    .filter(
      (answer): answer is QuizAnswerRecord & { latentDelta: number } =>
        answer.questionType === "latent" && typeof answer.latentDelta === "number",
    )
    .map((answer) => answer.latentDelta);

  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
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
  finalScores?: Map<string, number>,
): MatchResult[] {
  return profiles
    .filter((profile) => !profile.hidden)
    .map((profile) =>
      createMatchResult(
        profile,
        userVector,
        finalScores?.get(profile.id) ?? cosineSimilarity(userVector, profile.anchor),
      ),
    )
    .sort(compareMatches);
}

export function evaluateQuizResult(input: EvaluateQuizResultInput): MatchComputation {
  const answers = input.answers ?? [];
  const vector = input.userVector ?? buildQuizVector(answers);
  const latentScore = buildLatentScore(answers);
  const tagCounts = countAnswerTags(answers);
  const { finalScores, tieBreak } = resolveTieBreak(
    vector,
    latentScore,
    input.profiles,
    input.tieBreakerRule,
  );
  const allRanking = input.profiles
    .map((profile) => ({
      profile,
      match: createMatchResult(profile, vector, finalScores.get(profile.id) ?? 0),
    }))
    .sort((left, right) => compareMatches(left.match, right.match));
  const ranking = allRanking
    .filter((entry) => !entry.profile.hidden)
    .map((entry) => entry.match);

  return {
    vector,
    latentScore,
    ranking,
    tieBreak,
    hiddenMatch: evaluateHiddenCharacter(allRanking, tieBreak),
    tagCounts,
    responseInconsistency: checkReverseConflict(answers),
  };
}

function resolveTieBreak(
  userVector: AxisVector,
  latentScore: number,
  profiles: CharacterProfile[],
  tieRule: QuizMeta["tieBreakerRule"],
): {
  finalScores: Map<string, number>;
  tieBreak: TieBreakDecision | null;
} {
  const baseScores = new Map(
    profiles.map((profile) => [profile.id, cosineSimilarity(userVector, profile.anchor)]),
  );
  const sortedBaseProfiles = [...profiles].sort((left, right) =>
    compareScoreEntries(
      { id: left.id, score: baseScores.get(left.id) ?? 0 },
      { id: right.id, score: baseScores.get(right.id) ?? 0 },
    ),
  );
  const finalScores = new Map(baseScores);

  if (sortedBaseProfiles.length < 2) {
    return {
      finalScores,
      tieBreak: null,
    };
  }

  const [first, second] = sortedBaseProfiles;
  const firstScore = baseScores.get(first.id) ?? 0;
  const secondScore = baseScores.get(second.id) ?? 0;
  const scoreGap = firstScore - secondScore;
  const includesAny = new Set(tieRule.onlyWhenTop2IncludesAnyOf);
  const names = [first.name, second.name];

  let tieBreak: TieBreakDecision | null = null;

  if (
    scoreGap < tieRule.enabledWhenTop2DiffBelow &&
    names.some((name) => includesAny.has(name))
  ) {
    const isPriorityPair = tieRule.priorityPairs.some((pair) => {
      const sortedPair = [...pair].sort().join("::");
      const sortedNames = [...names].sort().join("::");
      return sortedPair === sortedNames;
    });
    const lambda = isPriorityPair
      ? tieRule.lambda.priorityPair
      : tieRule.lambda.default;

    for (const profile of [first, second]) {
      const latentMatch = 1 - Math.abs(latentScore - profile.latentAnchor);
      finalScores.set(profile.id, (baseScores.get(profile.id) ?? 0) + lambda * latentMatch);
    }

    const rankedAfterTieBreak = [first, second].sort((left, right) =>
      compareScoreEntries(
        { id: left.id, score: finalScores.get(left.id) ?? 0 },
        { id: right.id, score: finalScores.get(right.id) ?? 0 },
      ),
    );

    tieBreak = {
      threshold: tieRule.enabledWhenTop2DiffBelow,
      scoreGap,
      primaryTrait: tieRule.primaryTrait,
      lambda,
      winnerId: rankedAfterTieBreak[0].id,
      runnerUpId: rankedAfterTieBreak[1].id,
      winnerName: rankedAfterTieBreak[0].name,
      runnerUpName: rankedAfterTieBreak[1].name,
      reason: `前两名 base cosine 差值小于 ${tieRule.enabledWhenTop2DiffBelow.toFixed(
        2,
      )}，且包含爽世/祥子，因此追加控制/服务 latent 收束。`,
    };
  }

  return { finalScores, tieBreak };
}

function evaluateHiddenCharacter(
  ranking: RankedMatchEntry[],
  tieBreak: TieBreakDecision | null,
): HiddenMatchResult | null {
  const hiddenLead = ranking.find((entry) => entry.profile.hidden);
  const publicLead = ranking.find((entry) => !entry.profile.hidden);

  if (!hiddenLead || !publicLead) {
    return null;
  }

  if (hiddenLead.match.score < publicLead.match.score) {
    return null;
  }

  const matchedTags = ["top-rank-hidden"];
  if (
    tieBreak &&
    [tieBreak.winnerId, tieBreak.runnerUpId].includes(hiddenLead.match.id)
  ) {
    matchedTags.push("latent-tie-break");
  }

  return {
    id: hiddenLead.match.id,
    name: hiddenLead.match.name,
    title: hiddenLead.match.title,
    triggered: true,
    matchedTags,
    description:
      "按当前 V2.1D 的 3D + latent 规则，祥子在全量候选里已经压过公开榜首，所以额外保留为隐藏命中信号，但不覆盖公开主结果展示。",
    score: hiddenLead.match.score,
  };
}

function checkReverseConflict(answers: QuizAnswerRecord[]): boolean {
  const q6 = answers.find((answer) => answer.questionId === "Q6");
  const q20 = answers.find((answer) => answer.questionId === "Q20");
  if (!q6 || !q20) {
    return false;
  }

  const q6Value = q6.delta[2];
  const q20Value = q20.delta[2];
  return (q6Value <= -0.7 && q20Value >= 0.7) || (q20Value <= -0.7 && q6Value >= 0.7);
}

function createMatchResult(
  profile: CharacterProfile,
  userVector: AxisVector,
  score: number,
): MatchResult {
  return {
    id: profile.id,
    name: profile.name,
    title: profile.title,
    score,
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
  return compareScoreEntries(left, right);
}

function compareScoreEntries(
  left: { id: string; score: number },
  right: { id: string; score: number },
): number {
  if (left.score !== right.score) {
    return right.score - left.score;
  }

  return left.id.localeCompare(right.id);
}
