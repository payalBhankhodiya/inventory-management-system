import Fastify from "fastify";

import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";

import { registerCors } from "./plugins/cors.js";
import { registerJwt } from "./plugins/jwt.js";
import { registerSwagger } from "./plugins/swagger.js";
import { authRoutes } from "./modules/auth/auth.route.js";
import { userRoutes } from "./modules/users/user.route.js";
import { roleRoutes } from "./modules/roles/role.route.js";
import { siteRoutes } from "./modules/sites/site.route.js";
import { departmentRoutes } from "./modules/departments/department.route.js";
import { storageAreaRoutes } from "./modules/storage-areas/storage-area.route.js";
import { storageUnitRoutes } from "./modules/storage-units/storage-unit.route.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(registerCors);
  await app.register(registerJwt);

  // Register Swagger directly
  await registerSwagger(app);

  // Register routes after Swagger
  await app.register(authRoutes, {
  prefix: "/api/auth",
});

await app.register(userRoutes, {
  prefix: "/api/users",
});

await app.register(roleRoutes, {
  prefix: "/api/roles",
});

await app.register(siteRoutes, {
  prefix: "/api/sites",
});

await app.register(departmentRoutes, {
  prefix: "/api/departments",
});

await app.register(storageAreaRoutes, {
  prefix: "/api/storage-areas",
});

await app.register(storageUnitRoutes, {
  prefix: "/api/storage-units",
});

  app.get("/health", async () => {
    return {
      success: true,
      message: "Inventory Management System is running",
    };
  });

  return app;
}