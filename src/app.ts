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
import { organizationRoutes } from "./modules/organizations/organization.route.js";
import { permissionRoutes } from "./modules/permissions/permission.route.js";
import { authenticate } from "./middleware/auth.js";

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

  // Public routes
  await app.register(authRoutes, {
    prefix: "/api/auth",
  });

  // All protected routes
  await app.register(async (protectedApp) => {
    protectedApp.addHook("onRequest", authenticate);

    await protectedApp.register(organizationRoutes, {
      prefix: "/api/organizations",
    });

    await protectedApp.register(userRoutes, {
      prefix: "/api/users",
    });

    await protectedApp.register(roleRoutes, {
      prefix: "/api/roles",
    });

    await protectedApp.register(permissionRoutes, {
      prefix: "/api/permissions",
    });

    await protectedApp.register(siteRoutes, {
      prefix: "/api/sites",
    });

    await protectedApp.register(departmentRoutes, {
      prefix: "/api/departments",
    });

    await protectedApp.register(storageAreaRoutes, {
      prefix: "/api/storage-areas",
    });

    await protectedApp.register(storageUnitRoutes, {
      prefix: "/api/storage-units",
    });

    await protectedApp.register(itemCategoryRoutes, {
      prefix: "/api/item-categories",
    });

    await protectedApp.register(unitOfMeasureRoutes, {
      prefix: "/api/units-of-measure",
    });

    await protectedApp.register(itemRoutes, {
      prefix: "/api/items",
    });

    await protectedApp.register(vendorRoutes, {
      prefix: "/api/vendors",
    });

    await protectedApp.register(assetRoutes, {
      prefix: "/api/assets",
    });

    await protectedApp.register(inventoryRoutes, {
      prefix: "/api/inventory",
    });

    await protectedApp.register(stockTransactionRoutes, {
      prefix: "/api/stock-transactions",
    });

    await protectedApp.register(assignmentRoutes, {
      prefix: "/api/assignments",
    });

    await protectedApp.register(transferRoutes, {
      prefix: "/api/transfers",
    });

    await protectedApp.register(returnRoutes, {
      prefix: "/api/returns",
    });

    await protectedApp.register(maintenanceRoutes, {
      prefix: "/api/maintenances",
    });

    await protectedApp.register(disposalRoutes, {
      prefix: "/api/disposals",
    });

    await protectedApp.register(auditLogRoutes, {
      prefix: "/api/audit-logs",
    });

    await protectedApp.register(notificationRoutes, {
      prefix: "/api/notifications",
    });
  });

  // Public health check
  app.get("/health", async () => ({
    success: true,
    message: "Inventory Management System is running",
  }));
  return app;
}
