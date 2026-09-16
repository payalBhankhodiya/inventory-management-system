import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";

import {
  jsonSchemaTransform,
  jsonSchemaTransformObject,
} from "fastify-type-provider-zod";

export const registerSwagger = async (
  app: FastifyInstance,
) => {
  await app.register(fastifySwagger, {
    openapi: {
      openapi: "3.0.3",

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

      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },

    transform: jsonSchemaTransform,
    transformObject: jsonSchemaTransformObject,
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      persistAuthorization: true,
    },
  });
};