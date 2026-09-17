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
import { itemCategoryRoutes } from "./modules/item-categories/item-category.route.js";
import { unitOfMeasureRoutes } from "./modules/units-of-measure/unit-of-measure.route.js";
import { itemRoutes } from "./modules/items/item.route.js";
import { vendorRoutes } from "./modules/vendors/vendor.route.js";
import { assetRoutes } from "./modules/assets/asset.route.js";
import { inventoryRoutes } from "./modules/inventory/inventory.route.js";
import { stockTransactionRoutes } from "./modules/stock-transactions/stock-transaction.route.js";
import { assignmentRoutes } from "./modules/assignments/assignment.route.js";
import { transferRoutes } from "./modules/transfers/transfer.route.js";
import { returnRoutes } from "./modules/returns/return.route.js";
import { maintenanceRoutes } from "./modules/maintenance/maintenance.route.js";
import { disposalRoutes } from "./modules/disposals/disposal.route.js";
import { auditLogRoutes } from "./modules/audit-logs/audit-log.route.js";
import { notificationRoutes } from "./modules/notifications/notification.route.js";

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

  await app.register(itemCategoryRoutes, {
    prefix: "/api/item-categories",
  });

  await app.register(unitOfMeasureRoutes, {
    prefix: "/api/units-of-measure",
  });

  await app.register(itemRoutes, {
    prefix: "/api/items",
  });

  await app.register(vendorRoutes, {
    prefix: "/api/vendors",
  });

  await app.register(assetRoutes, {
    prefix: "/api/assets",
  });

  await app.register(inventoryRoutes, {
    prefix: "/api/inventory",
  });

  await app.register(stockTransactionRoutes, {
    prefix: "/api/stock-transactions",
  });

  await app.register(assignmentRoutes, {
    prefix: "/api/assignments",
  });

  await app.register(transferRoutes, {
    prefix: "/api/transfers",
  });

  await app.register(returnRoutes, {
    prefix: "/api/returns",
  });

  await app.register(maintenanceRoutes, {
    prefix: "/api/maintenances",
  });

  await app.register(disposalRoutes, {
    prefix: "/api/disposals",
  });

  await app.register(auditLogRoutes, {
    prefix: "/api/audit-logs",
  });

  await app.register(notificationRoutes, {
    prefix: "/api/notifications",
  });

  app.get("/health", async () => {
    return {
      success: true,
      message: "Inventory Management System is running",
    };
  });

  return app;
}
