import {
  evaluateQuizResult,
  type CharacterProfile,
  type MatchComputation,
  type QuizMeta,
} from "@mygobti/quiz-core";

interface ResultPreviewModel {
  result: MatchComputation;
  selectedProfile: CharacterProfile;
  usesHiddenOverride: boolean;
}

export function createResultPreviewModel(
  characters: CharacterProfile[],
  selectedId: string,
  tieBreakerRule: QuizMeta["tieBreakerRule"],
): ResultPreviewModel {
  const fallbackProfile = characters.find((profile) => !profile.hidden) ?? characters[0];
  const selectedProfile =
    characters.find((profile) => profile.id === selectedId) ?? fallbackProfile;

  if (!selectedProfile) {
    throw new Error("Result preview requires at least one character profile.");
  }

  const usesHiddenOverride = selectedProfile.hidden;
  const previewProfiles = characters.map((profile) =>
    profile.id === selectedProfile.id && profile.hidden
      ? { ...profile, hidden: false }
      : profile,
  );

  return {
    selectedProfile,
    usesHiddenOverride,
    result: evaluateQuizResult({
      profiles: previewProfiles,
      tieBreakerRule,
      userVector: selectedProfile.anchor,
    }),
  };
}
