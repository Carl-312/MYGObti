import { toBlob } from "html-to-image";

const EXPORT_PIXEL_RATIO = Math.min(window.devicePixelRatio || 1, 2);
export const POSTER_EXPORT_WIDTH = 540;
export const POSTER_EXPORT_HEIGHT = 720;

export interface ExportedPosterAsset {
  blob: Blob;
  fileName: string;
}

export async function exportPoster(
  node: HTMLElement,
  characterId: string,
): Promise<ExportedPosterAsset> {
  await preparePosterNode(node);

  const exportNode = createPosterExportNode(node);
  await preparePosterNode(exportNode);

  try {
    const blob = await toBlob(exportNode, {
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
  } finally {
    exportNode.remove();
  }
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

async function preparePosterNode(node: HTMLElement) {
  await Promise.all([waitForDocumentFonts(), waitForPosterImages(node)]);
}

function createPosterExportNode(node: HTMLElement): HTMLDivElement {
  const contentWidth = Math.max(node.scrollWidth, POSTER_EXPORT_WIDTH);
  const contentHeight = Math.max(node.scrollHeight, POSTER_EXPORT_HEIGHT);
  const scale = Math.min(
    POSTER_EXPORT_WIDTH / contentWidth,
    POSTER_EXPORT_HEIGHT / contentHeight,
    1,
  );
  const scaledWidth = contentWidth * scale;
  const clone = node.cloneNode(true) as HTMLElement;
  const sandbox = document.createElement("div");

  sandbox.setAttribute("aria-hidden", "true");
  sandbox.style.position = "fixed";
  sandbox.style.left = "-10000px";
  sandbox.style.top = "0";
  sandbox.style.width = `${POSTER_EXPORT_WIDTH}px`;
  sandbox.style.height = `${POSTER_EXPORT_HEIGHT}px`;
  sandbox.style.overflow = "hidden";
  sandbox.style.background = "#0a0c14";
  sandbox.style.pointerEvents = "none";
  sandbox.style.zIndex = "-1";

  clone.style.width = `${contentWidth}px`;
  clone.style.minWidth = `${contentWidth}px`;
  clone.style.maxWidth = `${contentWidth}px`;
  clone.style.minHeight = `${contentHeight}px`;
  clone.style.height = "auto";
  clone.style.borderRadius = "0";
  clone.style.boxShadow = "none";
  clone.style.transform = `translateX(${(POSTER_EXPORT_WIDTH - scaledWidth) / 2}px) scale(${scale})`;
  clone.style.transformOrigin = "top left";

  sandbox.append(clone);
  document.body.append(sandbox);

  return sandbox;
}

async function waitForDocumentFonts() {
  if (!("fonts" in document)) {
    return;
  }

  try {
    await document.fonts.ready;
  } catch {
    // Ignore font readiness failures and let export continue.
  }
}

async function waitForPosterImages(node: HTMLElement) {
  const images = Array.from(node.querySelectorAll("img"));

  await Promise.all(images.map((image) => waitForImage(image)));
}

async function waitForImage(image: HTMLImageElement) {
  if (image.complete && image.naturalWidth > 0) {
    await image.decode?.().catch(() => undefined);
    return;
  }

  await new Promise<void>((resolve) => {
    const cleanup = () => {
      image.removeEventListener("load", handleComplete);
      image.removeEventListener("error", handleComplete);
    };
    const handleComplete = () => {
      cleanup();
      resolve();
    };

    image.addEventListener("load", handleComplete, { once: true });
    image.addEventListener("error", handleComplete, { once: true });
  });

  await image.decode?.().catch(() => undefined);
}
