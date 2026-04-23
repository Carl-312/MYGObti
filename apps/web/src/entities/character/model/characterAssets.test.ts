import { describe, expect, it } from "vitest";
import {
  CHARACTER_ASSET_IDS,
  getCharacterAssetContract,
  normalizeCharacterAssetId,
} from "./characterAssets";

describe("character asset resolver", () => {
  it("covers every manifest-backed character id", () => {
    expect(CHARACTER_ASSET_IDS.sort()).toEqual([
      "anon",
      "mutsumi",
      "raana",
      "sakiko",
      "soyo",
      "taki",
      "tomori",
      "uika",
    ]);
  });

  it("normalizes legacy ids to the manifest contract", () => {
    expect(normalizeCharacterAssetId("rana")).toBe("raana");
    expect(normalizeCharacterAssetId("uhika")).toBe("uika");
  });

  it("resolves both round icon and live2d assets for aliased ids", () => {
    const raana = getCharacterAssetContract("rana");
    const uika = getCharacterAssetContract("uhika");

    expect(raana.id).toBe("raana");
    expect(raana.roundIcon.status).toBe("ready");
    expect(raana.live2d.status).toBe("ready");

    expect(uika.id).toBe("uika");
    expect(uika.roundIcon.status).toBe("ready");
    expect(uika.live2d.status).toBe("ready");
  });
});
