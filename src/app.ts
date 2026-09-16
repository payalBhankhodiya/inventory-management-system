import Fastify from "fastify";
import { registerCors } from "./plugins/cors.js";
import { registerJwt } from "./plugins/jwt.js";
import { registerSwagger } from "./plugins/swagger.js";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.register(registerCors);
  app.register(registerJwt);
  app.register(registerSwagger);

  app.get("/health", async () => {
    return {
      success: true,
      message: "Inventory Management System is running",
    };
  });

  return app;
}