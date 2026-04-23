import { describe, expect, it } from "vitest";
import type { CharacterProfile, QuizMeta } from "@mygobti/quiz-core";
import { createResultPreviewModel } from "./resultPreviewModel";

const TIE_BREAK_RULE: QuizMeta["tieBreakerRule"] = {
  enabledWhenTop2DiffBelow: 0.1,
  onlyWhenTop2IncludesAnyOf: ["公开A", "隐藏C"],
  primaryTrait: "latent",
  lambda: {
    default: 0.35,
    priorityPair: 0.5,
  },
  priorityPairs: [["公开A", "隐藏C"]],
};

const PROFILES: CharacterProfile[] = [
  createProfile("public-a", "公开A", false, [3, 0, 0], "public-b", "hidden-c"),
  createProfile("public-b", "公开B", false, [0, 3, 0], "public-a", "hidden-c"),
  createProfile("hidden-c", "隐藏C", true, [0, 0, 3], "public-a", "public-b"),
];

describe("createResultPreviewModel", () => {
  it("keeps public selections aligned with the computed public result", () => {
    const preview = createResultPreviewModel(PROFILES, "public-a", TIE_BREAK_RULE);

    expect(preview.selectedProfile.id).toBe("public-a");
    expect(preview.usesHiddenOverride).toBe(false);
    expect(preview.result.ranking[0]?.id).toBe("public-a");
  });

  it("temporarily exposes hidden selections for dev-only result QA", () => {
    const preview = createResultPreviewModel(PROFILES, "hidden-c", TIE_BREAK_RULE);

    expect(preview.selectedProfile.id).toBe("hidden-c");
    expect(preview.usesHiddenOverride).toBe(true);
    expect(preview.result.ranking[0]?.id).toBe("hidden-c");
    expect(preview.result.hiddenMatch).toBeNull();
  });
});

function createProfile(
  id: string,
  name: string,
  hidden: boolean,
  anchor: [number, number, number],
  rivalId: string,
  soulmateId: string,
): CharacterProfile {
  return {
    id,
    name,
    hidden,
    anchor,
    latentAnchor: 0.4,
    relationships: {
      rivalId,
      soulmateId,
    },
    result: {
      description: `${name} description`,
      shortReview: `${name} review`,
      quote: `${name} quote`,
      posterCaption: `${name} poster`,
      highlights: [`${name} highlight`],
    },
    summary: `${name} summary`,
    tags: [name],
    title: `${name} title`,
  };
}
