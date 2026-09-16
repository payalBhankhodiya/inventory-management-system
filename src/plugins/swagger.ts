import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";

export async function registerSwagger(app: FastifyInstance) {
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Inventory Management System API",
        description: "Backend API for internal inventory management",
        version: "1.0.0",
      },
      servers: [
        {
          url: "http://localhost:5000",
        },
      ],
      tags: [
        {
          name: "Auth",
          description: "Authentication APIs",
        },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
  });
}