import { readFile, stat } from "node:fs/promises";
import type {
  AxisId,
  AxisVector,
  CanonicalCharacterContent,
  Question,
  QuestionOption,
  QuestionOptionSet,
  QuestionType,
  QuizContentSnapshot,
  QuizMeta,
} from "@mygobti/quiz-core";

interface RawQuestionOption {
  id: string;
  text: string;
  delta: number[];
  latentDelta?: number;
}

interface RawQuestion {
  id: string;
  type: QuestionType;
  scene: string;
  primaryAxis?: AxisId;
  latentTrait?: string;
  options: RawQuestionOption[];
}

interface CanonicalSourceMeta extends Record<string, unknown> {
  version: string;
  note: string;
  axes: Record<string, string>;
  latentTraits: {
    controlServiceOrientation: {
      description: string;
      questionIds: string[];
      characterAnchors: Record<string, number>;
    };
  };
  tieBreakerRule: QuizMeta["tieBreakerRule"];
  carelessResponseRuleV2: {
    possibleSignals: string[];
    markWhenSignalCountAtLeast: number;
  };
  reverseCheckRule: string;
  experienceCurve: string;
}

interface CanonicalPayload {
  meta: CanonicalSourceMeta;
  questions: RawQuestion[];
}

type CanonicalCharacterRow = CanonicalCharacterContent;
type CanonicalContentSnapshot = QuizContentSnapshot;

interface CanonicalCacheEntry {
  mtimeMs: number;
  snapshot: CanonicalContentSnapshot;
}

const QUESTION_SOURCE_PATH = "questionedit/questionnewV2.md";
const QUESTION_SOURCE_URL = new URL(
  "../../../../questionedit/questionnewV2.md",
  import.meta.url,
);
const CANONICAL_JSON_START = '{\n"meta":';
const ORDER_HINTS = [
  { maxOrder: 5, hint: "轻冲突日常，先看你会不会主动碰场。", category: "轻冲突日常" },
  { maxOrder: 11, hint: "中等冲突，开始看你怎么处理关系和主张。", category: "中段拉扯" },
  { maxOrder: 16, hint: "深层自我拷问，答案会更直接暴露你的底色。", category: "深层拷问" },
  { maxOrder: 19, hint: "这题只影响 latent tie-break，不直接累计三轴。", category: "latent 校正" },
  { maxOrder: 20, hint: "这题会参与反向校验，主要看答题一致性。", category: "反向校验" },
] as const;

const axisCategoryLabels: Record<AxisId, string> = {
  emotionExpression: "情感表达",
  socialStrategy: "社交策略",
  selfRecognition: "自我认知",
};

let cache: CanonicalCacheEntry | null = null;

export async function preloadCanonicalContent(): Promise<CanonicalContentSnapshot> {
  return getCanonicalContent();
}

export async function getCanonicalContent(): Promise<CanonicalContentSnapshot> {
  const sourceStat = await stat(QUESTION_SOURCE_URL);
  if (cache && cache.mtimeMs === sourceStat.mtimeMs) {
    return cache.snapshot;
  }

  const source = await readFile(QUESTION_SOURCE_URL, "utf8");
  const parsedPayload = parseEmbeddedJson(source);
  const parsedCharacters = parseCharacterTable(source);
  const characters = buildCanonicalCharacters(
    parsedCharacters,
    parsedPayload.meta.latentTraits.controlServiceOrientation.characterAnchors,
  );
  const questions = parsedPayload.questions.map((question) => buildQuestion(question));

  const snapshot: CanonicalContentSnapshot = {
    sourcePath: QUESTION_SOURCE_PATH,
    version: parsedPayload.meta.version,
    meta: parsedPayload.meta,
    quizMeta: {
      note: parsedPayload.meta.note,
      tieBreakerRule: parsedPayload.meta.tieBreakerRule,
    },
    questions,
    characters,
    counts: {
      questions: questions.length,
      characters: characters.length,
      publicCharacters: characters.filter((character) => !character.hidden).length,
      hiddenCharacters: characters.filter((character) => character.hidden).length,
    },
  };

  cache = {
    mtimeMs: sourceStat.mtimeMs,
    snapshot,
  };

  return snapshot;
}

function buildCanonicalCharacters(
  characters: Map<string, Omit<CanonicalCharacterRow, "latentAnchor">>,
  anchorMap: Record<string, number>,
): CanonicalCharacterRow[] {
  return [...characters.values()].map((character) => ({
    ...character,
    latentAnchor: anchorMap[character.name] ?? 0,
  }));
}

function buildQuestion(raw: RawQuestion): Question {
  const order = Number(raw.id.replace(/^Q/i, ""));
  const hintRow =
    ORDER_HINTS.find((item) => order <= item.maxOrder) ??
    ORDER_HINTS[ORDER_HINTS.length - 1];

  let category: string = hintRow.category;
  if (raw.type === "scored" && raw.primaryAxis) {
    category = axisCategoryLabels[raw.primaryAxis];
  } else if (raw.type === "latent") {
    category = "控制/服务 latent";
  } else if (raw.type === "reverse_check") {
    category = "反向校验";
  }

  const options = raw.options.map((option) => buildOption(option, raw.type));
  if (options.length !== 4) {
    throw new Error(`${raw.id} expected 4 options, got ${options.length}.`);
  }

  return {
    id: raw.id,
    order,
    qtype: raw.type,
    category,
    prompt: raw.scene,
    sceneHint: hintRow.hint,
    primaryAxis: raw.primaryAxis,
    latentTrait: raw.latentTrait,
    tags: [raw.type, raw.primaryAxis, raw.latentTrait].filter(
      (value): value is string => Boolean(value),
    ),
    options: options as QuestionOptionSet,
  };
}

function buildOption(raw: RawQuestionOption, qtype: QuestionType): QuestionOption {
  const resultNote =
    qtype === "latent"
      ? "这题只参与 latent tie-break，不直接计入三轴。"
      : qtype === "reverse_check"
        ? "这题会计入三轴，并参与一致性反向校验。"
        : "这题会计入三轴主模型。";

  return {
    id: raw.id,
    text: raw.text,
    delta: toAxisVector(raw.delta),
    latentDelta: raw.latentDelta,
    tags: [qtype, raw.id],
    resultNote,
  };
}

function parseCharacterTable(
  source: string,
): Map<string, Omit<CanonicalCharacterRow, "latentAnchor">> {
  const lines = source.split("\n");
  const headerIndex = lines.findIndex(
    (line) => line.includes("角色") && line.includes("控制/服务 latent"),
  );
  if (headerIndex === -1) {
    throw new Error("Canonical character table not found.");
  }

  const rows = new Map<string, Omit<CanonicalCharacterRow, "latentAnchor">>();
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.trim().startsWith("|")) {
      break;
    }

    const cells = line
      .trim()
      .slice(1, -1)
      .split("|")
      .map((cell) => cell.trim());
    if (cells.length < 7) {
      continue;
    }

    const rawName = cells[0];
    const name = cleanMarkdown(rawName);
    rows.set(name, {
      name,
      title: cleanMarkdown(cells[1]),
      anchor: [Number(cells[2]), Number(cells[3]), Number(cells[4])],
      description: cleanMarkdown(cells[6]),
      hidden: rawName.includes("隐藏"),
    });
  }

  if (rows.size !== 8) {
    throw new Error(`Expected 8 canonical characters, got ${rows.size}.`);
  }

  return rows;
}

function parseEmbeddedJson(source: string): CanonicalPayload {
  const start = source.indexOf(CANONICAL_JSON_START);
  if (start === -1) {
    throw new Error("Canonical embedded JSON not found.");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        end = index + 1;
        break;
      }
    }
  }

  if (end === -1) {
    throw new Error("Canonical embedded JSON is incomplete.");
  }

  return JSON.parse(source.slice(start, end)) as CanonicalPayload;
}

function toAxisVector(values: number[]): AxisVector {
  if (values.length !== 3) {
    throw new Error(`Expected 3D axis vector, got ${values.length}.`);
  }

  return [values[0], values[1], values[2]];
}

function cleanMarkdown(value: string): string {
  return value
    .replace(/\*\([^)]*\)\*/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
