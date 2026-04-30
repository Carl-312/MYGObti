import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";

const LOCAL_WEB_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

export async function registerCors(server: FastifyInstance): Promise<void> {
  const configuredOrigins = (process.env.WEB_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = new Set([...LOCAL_WEB_ORIGINS, ...configuredOrigins]);

  await server.register(cors, {
    methods: ["GET", "HEAD"],
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
  });
}
