export type SharePosterOutcome = "shared" | "cancelled" | "unsupported";

interface SharePosterInput {
  file: File;
  title: string;
  text: string;
}

export async function sharePoster({
  file,
  title,
  text,
}: SharePosterInput): Promise<SharePosterOutcome> {
  if (typeof navigator.share !== "function") {
    return "unsupported";
  }

  if (
    typeof navigator.canShare !== "function" ||
    !navigator.canShare({ files: [file] })
  ) {
    return "unsupported";
  }

  try {
    await navigator.share({
      files: [file],
      title,
      text,
    });

    return "shared";
  } catch (error) {
    if (isAbortError(error)) {
      return "cancelled";
    }

    throw error;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
