import type { FastifyInstance } from "fastify";
import { getCanonicalContent } from "../services/canonicalContent.js";

const healthResponseSchema = {
  type: "object",
  required: ["ok", "service", "version", "sourcePath"],
  properties: {
    ok: { type: "boolean" },
    service: { type: "string" },
    version: { type: "string" },
    sourcePath: { type: "string" },
  },
} as const;

export async function registerHealthRoutes(server: FastifyInstance): Promise<void> {
  server.get(
    "/api/health",
    {
      schema: {
        summary: "Health check for the content API",
        response: {
          200: healthResponseSchema,
        },
      },
    },
    async () => {
      const content = await getCanonicalContent();

      return {
        ok: true,
        service: "mygobti-api",
        version: content.version,
        sourcePath: content.sourcePath,
      };
    },
  );
}
