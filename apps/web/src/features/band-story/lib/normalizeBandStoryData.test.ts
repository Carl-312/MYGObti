import rawStoryData from "../../../../../../frontend-design/fronted1-workbench/fronted1.cleaned.json";
import { normalizeBandStoryData } from "./normalizeBandStoryData";

describe("normalizeBandStoryData", () => {
  it("keeps the extracted chapter count and richer chapter structure", () => {
    const story = normalizeBandStoryData(rawStoryData);

    expect(story.chapters).toHaveLength(41);
    expect(story.chapters[0].meta.lineCount).toBe(50);
    expect(story.chapters[0].scenes).toHaveLength(2);
    expect(story.chapters[0].dialogueGroups).toHaveLength(10);
    expect(story.chapters[0].dialogues[0].character?.label).toBe("Tomori");
    expect(story.chapters[1].meta.contentStatus).toBe("meta-only");
  });
});
