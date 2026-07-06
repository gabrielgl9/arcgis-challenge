import cors from "@fastify/cors";
import Fastify from "fastify";
import { registerRoutes } from "./api/routes";
import { config } from "./config";

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors);
  await registerRoutes(app);

  // Health check
  app.get("/health", async () => {
    return { status: "ok" };
  });

  return app;
}

export async function startApp() {
  const app = await buildApp();

  try {
    await app.listen({ port: config.port, host: "0.0.0.0" });
    console.log(`Server running on http://localhost:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
