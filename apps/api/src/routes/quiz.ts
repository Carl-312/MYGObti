import type { FastifyInstance } from "fastify";
import { getCanonicalContent } from "../services/canonicalContent.js";

const quizMetaResponseSchema = {
  type: "object",
  required: ["version", "sourcePath", "note", "tieBreakerRule", "counts"],
  properties: {
    version: { type: "string" },
    sourcePath: { type: "string" },
    note: { type: "string" },
    tieBreakerRule: {
      type: "object",
      additionalProperties: true,
    },
    counts: {
      type: "object",
      required: [
        "questions",
        "characters",
        "publicCharacters",
        "hiddenCharacters",
      ],
      properties: {
        questions: { type: "integer" },
        characters: { type: "integer" },
        publicCharacters: { type: "integer" },
        hiddenCharacters: { type: "integer" },
      },
    },
  },
} as const;

const quizContentResponseSchema = {
  type: "object",
  required: [
    "version",
    "sourcePath",
    "meta",
    "quizMeta",
    "questions",
    "characters",
    "counts",
  ],
  properties: {
    version: { type: "string" },
    sourcePath: { type: "string" },
    meta: {
      type: "object",
      additionalProperties: true,
    },
    quizMeta: {
      type: "object",
      additionalProperties: true,
    },
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true,
      },
    },
    characters: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true,
      },
    },
    counts: {
      type: "object",
      additionalProperties: true,
    },
  },
} as const;

export async function registerQuizRoutes(server: FastifyInstance): Promise<void> {
  server.get(
    "/api/quiz/meta",
    {
      schema: {
        summary: "Canonical quiz metadata",
        response: {
          200: quizMetaResponseSchema,
        },
      },
    },
    async () => {
      const content = await getCanonicalContent();

      return {
        version: content.version,
        sourcePath: content.sourcePath,
        note: content.quizMeta.note,
        tieBreakerRule: content.quizMeta.tieBreakerRule,
        counts: content.counts,
      };
    },
  );

  server.get(
    "/api/quiz/content",
    {
      schema: {
        summary: "Canonical quiz content snapshot",
        response: {
          200: quizContentResponseSchema,
        },
      },
    },
    async () => getCanonicalContent(),
  );
}
