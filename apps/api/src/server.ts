import Fastify from "fastify";
import { registerCors } from "./plugins/cors.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerQuizRoutes } from "./routes/quiz.js";
import { preloadCanonicalContent } from "./services/canonicalContent.js";

export function buildServer() {
  const server = Fastify({
    logger: true,
  });

  void server.register(registerCors);
  void server.register(registerHealthRoutes);
  void server.register(registerQuizRoutes);

  return server;
}

async function start() {
  const server = buildServer();

  try {
    await preloadCanonicalContent();
    await server.listen({
      host: "0.0.0.0",
      port: Number(process.env.PORT ?? 3001),
    });
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void start();
}
