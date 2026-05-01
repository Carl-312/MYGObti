import { toBlob } from "html-to-image";

const EXPORT_PIXEL_RATIO = Math.min(window.devicePixelRatio || 1, 2);
const POSTER_EXPORT_WIDTH = 540;
const POSTER_EXPORT_HEIGHT = 720;

export interface ExportedPosterAsset {
  blob: Blob;
  fileName: string;
}

export async function exportPoster(
  node: HTMLElement,
  characterId: string,
): Promise<ExportedPosterAsset> {
  const blob = await toBlob(node, {
    backgroundColor: "#0a0c14",
    cacheBust: true,
    height: POSTER_EXPORT_HEIGHT,
    pixelRatio: EXPORT_PIXEL_RATIO,
    skipFonts: true,
    style: {
      borderRadius: "0",
      boxShadow: "none",
      height: `${POSTER_EXPORT_HEIGHT}px`,
      width: `${POSTER_EXPORT_WIDTH}px`,
    },
    width: POSTER_EXPORT_WIDTH,
  });

  if (!blob) {
    throw new Error("海报导出失败：浏览器没有生成图片文件。");
  }

  return {
    blob,
    fileName: createPosterFileName(characterId),
  };
}

export function downloadPoster(asset: ExportedPosterAsset) {
  const objectUrl = URL.createObjectURL(asset.blob);
  const link = document.createElement("a");

  link.download = asset.fileName;
  link.href = objectUrl;
  link.click();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 0);
}

export function createPosterFile(asset: ExportedPosterAsset): File | null {
  if (typeof File !== "function") {
    return null;
  }

  return new File([asset.blob], asset.fileName, {
    type: asset.blob.type || "image/png",
  });
}

function createPosterFileName(characterId: string): string {
  const stamp = new Date().toISOString().slice(0, 10);

  return `mygobti-${characterId}-${stamp}.png`;
}
