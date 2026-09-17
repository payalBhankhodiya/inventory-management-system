import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";
import {
  jsonSchemaTransform,
  jsonSchemaTransformObject,
} from "fastify-type-provider-zod";

export const registerSwagger = async (app: FastifyInstance) => {
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
        { name: "Auth", description: "Authentication APIs" },
        { name: "Organizations", description: "Organization APIs" },
        { name: "Users", description: "User APIs" },
        { name: "Roles", description: "Role APIs" },
        { name: "Permissions", description: "Permission APIs" },
        { name: "Sites", description: "Site APIs" },
        { name: "Departments", description: "Department APIs" },
        { name: "Storage Areas", description: "Storage area APIs" },
        { name: "Storage Units", description: "Storage unit APIs" },
        { name: "Item Categories", description: "Item category APIs" },
        { name: "Units of Measure", description: "Unit of measure APIs" },
        { name: "Items", description: "Item APIs" },
        { name: "Vendors", description: "Vendor APIs" },
        { name: "Assets", description: "Asset APIs" },
        { name: "Inventory", description: "Inventory APIs" },
        { name: "Stock Transactions", description: "Stock transaction APIs" },
        { name: "Assignments", description: "Assignment APIs" },
        { name: "Transfers", description: "Transfer APIs" },
        { name: "Returns", description: "Return APIs" },
        { name: "Maintenance", description: "Maintenance APIs" },
        { name: "Disposals", description: "Disposal APIs" },
        { name: "Audit Logs", description: "Audit log APIs" },
        { name: "Notifications", description: "Notification APIs" },
      ],

      // Default authentication for all APIs
      security: [{ bearerAuth: [] }],

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