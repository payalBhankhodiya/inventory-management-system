import "dotenv/config";
import { eq, and } from "drizzle-orm";
import { db } from "../index.js";

import { organizations } from "../schema/organization.js";
import { roles } from "../schema/role.js";
import { permissions } from "../schema/permission.js";
import { rolePermissions } from "../schema/role-permission.js";
import { users } from "../schema/user.js";
import { sites } from "../schema/site.js";
import { departments } from "../schema/department.js";
import { storageAreas } from "../schema/storage-area.js";
import { storageUnits } from "../schema/storage-unit.js";
import { itemCategories } from "../schema/item-category.js";
import { unitsOfMeasure } from "../schema/unit-of-measure.js";
import { vendors } from "../schema/vendor.js";

import bcrypt from "bcrypt";

async function seed() {
  console.log("Starting database seed...");

  // ============================================================
  // ORGANIZATION
  // ============================================================

  let organization = await db.query.organizations.findFirst({
    where: eq(organizations.code, "DEMO"),
  });

  if (!organization) {
    [organization] = await db
      .insert(organizations)
      .values({
        name: "Demo Organization",
        code: "DEMO",
        email: "admin@demo.com",
        phone: "9999999999",
        address: {
          addressLine1: "Main Road",
          city: "Morbi",
          state: "Gujarat",
          country: "India",
          postalCode: "363641",
        },
        status: "ACTIVE",
      })
      .returning();
  }

  if (!organization) {
    throw new Error("Failed to create organization");
  }

  console.log(`Organization: ${organization.name}`);

  // ============================================================
  // PERMISSIONS
  // ============================================================

  const permissionData = [
    {
      name: "user.create",
      description: "Create users",
      module: "USER",
      action: "CREATE",
    },
    {
      name: "user.read",
      description: "View users",
      module: "USER",
      action: "READ",
    },
    {
      name: "user.update",
      description: "Update users",
      module: "USER",
      action: "UPDATE",
    },
    {
      name: "user.delete",
      description: "Delete users",
      module: "USER",
      action: "DELETE",
    },
    {
      name: "item.create",
      description: "Create items",
      module: "ITEM",
      action: "CREATE",
    },
    {
      name: "item.read",
      description: "View items",
      module: "ITEM",
      action: "READ",
    },
    {
      name: "item.update",
      description: "Update items",
      module: "ITEM",
      action: "UPDATE",
    },
    {
      name: "item.delete",
      description: "Delete items",
      module: "ITEM",
      action: "DELETE",
    },
    {
      name: "inventory.read",
      description: "View inventory",
      module: "INVENTORY",
      action: "READ",
    },
    {
      name: "inventory.update",
      description: "Update inventory",
      module: "INVENTORY",
      action: "UPDATE",
    },
  ];

  const permissionRecords = [];

  for (const permissionDataItem of permissionData) {
    let permission = await db.query.permissions.findFirst({
      where: eq(permissions.name, permissionDataItem.name),
    });

    if (!permission) {
      [permission] = await db
        .insert(permissions)
        .values(permissionDataItem)
        .returning();
    }

    if (permission) {
      permissionRecords.push(permission);
    }
  }

  console.log(`Permissions: ${permissionRecords.length}`);

  // ============================================================
  // ADMIN ROLE
  // ============================================================

  let adminRole = await db.query.roles.findFirst({
    where: and(
      eq(roles.organizationId, organization.id),
      eq(roles.name, "Administrator"),
    ),
  });

  if (!adminRole) {
    [adminRole] = await db
      .insert(roles)
      .values({
        organizationId: organization.id,
        name: "Administrator",
        description: "System administrator with full access.",
        isSystemRole: true,
        status: "ACTIVE",
      })
      .returning();
  }

  if (!adminRole) {
    throw new Error("Failed to create administrator role");
  }

  console.log(`Role: ${adminRole.name}`);

  // ============================================================
  // ROLE PERMISSIONS
  // ============================================================

  for (const permission of permissionRecords) {
    const existingRolePermission =
      await db.query.rolePermissions.findFirst({
        where: and(
          eq(rolePermissions.roleId, adminRole.id),
          eq(rolePermissions.permissionId, permission.id),
        ),
      });

    if (!existingRolePermission) {
      await db.insert(rolePermissions).values({
        roleId: adminRole.id,
        permissionId: permission.id,
      });
    }
  }

  console.log("Administrator permissions assigned");

  // ============================================================
  // ADMIN USER
  // ============================================================

  let adminUser = await db.query.users.findFirst({
    where: eq(users.email, "admin@demo.com"),
  });

  if (!adminUser) {
    const passwordHash = await bcrypt.hash("Admin@123", 10);

    [adminUser] = await db
      .insert(users)
      .values({
        organizationId: organization.id,
        name: "System Administrator",
        email: "admin@demo.com",
        passwordHash,
        employeeCode: "EMP001",
        roleId: adminRole.id,
        status: "ACTIVE",
      })
      .returning();
  }

  if (!adminUser) {
    throw new Error("Failed to create admin user");
  }

  console.log(`Admin user: ${adminUser.email}`);

  // ============================================================
  // MAIN SITE
  // ============================================================

  let mainSite = await db.query.sites.findFirst({
    where: and(
      eq(sites.organizationId, organization.id),
      eq(sites.code, "MAIN"),
    ),
  });

  if (!mainSite) {
    [mainSite] = await db
      .insert(sites)
      .values({
        organizationId: organization.id,
        name: "Main Site",
        code: "MAIN",
        isMain: true,
        address: {
          addressLine1: "Main Road",
          city: "Morbi",
          state: "Gujarat",
          country: "India",
          postalCode: "363641",
        },
        managerId: adminUser.id,
        status: "ACTIVE",
      })
      .returning();
  }

  if (!mainSite) {
    throw new Error("Failed to create main site");
  }

  console.log(`Site: ${mainSite.name}`);

  // ============================================================
  // DEPARTMENT
  // ============================================================

  let department = await db.query.departments.findFirst({
    where: and(
      eq(departments.organizationId, organization.id),
      eq(departments.code, "IT"),
    ),
  });

  if (!department) {
    [department] = await db
      .insert(departments)
      .values({
        organizationId: organization.id,
        siteId: mainSite.id,
        name: "IT Department",
        code: "IT",
        description: "Information Technology Department",
        managerId: adminUser.id,
        status: "ACTIVE",
      })
      .returning();
  }

  if (!department) {
    throw new Error("Failed to create department");
  }

  console.log(`Department: ${department.name}`);

  // ============================================================
  // STORAGE AREA
  // ============================================================

  let storageArea = await db.query.storageAreas.findFirst({
    where: and(
      eq(storageAreas.organizationId, organization.id),
      eq(storageAreas.code, "MAIN-STORAGE"),
    ),
  });

  if (!storageArea) {
    [storageArea] = await db
      .insert(storageAreas)
      .values({
        organizationId: organization.id,
        siteId: mainSite.id,
        departmentId: department.id,
        name: "Main Storage Area",
        code: "MAIN-STORAGE",
        description: "Main inventory storage area",
        managerId: adminUser.id,
        status: "ACTIVE",
      })
      .returning();
  }

  if (!storageArea) {
    throw new Error("Failed to create storage area");
  }

  console.log(`Storage Area: ${storageArea.name}`);

  // ============================================================
  // STORAGE UNIT
  // ============================================================

  let storageUnit = await db.query.storageUnits.findFirst({
    where: and(
      eq(storageUnits.organizationId, organization.id),
      eq(storageUnits.code, "RACK-01"),
    ),
  });

  if (!storageUnit) {
    [storageUnit] = await db
      .insert(storageUnits)
      .values({
        organizationId: organization.id,
        storageAreaId: storageArea.id,
        name: "Rack 01",
        code: "RACK-01",
        type: "RACK",
        description: "Main storage rack",
        capacity: 100,
        status: "ACTIVE",
      })
      .returning();
  }

  if (!storageUnit) {
    throw new Error("Failed to create storage unit");
  }

  console.log(`Storage Unit: ${storageUnit.name}`);

  // ============================================================
  // ITEM CATEGORY
  // ============================================================

  let category = await db.query.itemCategories.findFirst({
    where: and(
      eq(itemCategories.organizationId, organization.id),
      eq(itemCategories.code, "ELECTRONICS"),
    ),
  });

  if (!category) {
    [category] = await db
      .insert(itemCategories)
      .values({
        organizationId: organization.id,
        name: "Electronics",
        code: "ELECTRONICS",
        description: "Electronic inventory items",
        status: "ACTIVE",
      })
      .returning();
  }

  if (!category) {
    throw new Error("Failed to create item category");
  }

  console.log(`Category: ${category.name}`);

  // ============================================================
  // UNIT OF MEASURE
  // ============================================================

  let unitOfMeasure = await db.query.unitsOfMeasure.findFirst({
    where: and(
      eq(unitsOfMeasure.organizationId, organization.id),
      eq(unitsOfMeasure.code, "PCS"),
    ),
  });

  if (!unitOfMeasure) {
    [unitOfMeasure] = await db
      .insert(unitsOfMeasure)
      .values({
        organizationId: organization.id,
        name: "Pieces",
        code: "PCS",
        description: "Individual pieces",
        status: "ACTIVE",
      })
      .returning();
  }

  if (!unitOfMeasure) {
    throw new Error("Failed to create unit of measure");
  }

  console.log(`Unit of Measure: ${unitOfMeasure.name}`);

  // ============================================================
  // VENDOR
  // ============================================================

  let vendor = await db.query.vendors.findFirst({
    where: and(
      eq(vendors.organizationId, organization.id),
      eq(vendors.code, "DEFAULT"),
    ),
  });

  if (!vendor) {
    [vendor] = await db
      .insert(vendors)
      .values({
        organizationId: organization.id,
        name: "Default Vendor",
        code: "DEFAULT",
        contactPerson: "Vendor Contact",
        email: "vendor@demo.com",
        phone: "9999999998",
        address: {
          addressLine1: "Vendor Road",
          city: "Morbi",
          state: "Gujarat",
          country: "India",
          postalCode: "363641",
        },
        status: "ACTIVE",
      })
      .returning();
  }

  if (!vendor) {
    throw new Error("Failed to create vendor");
  }

  console.log(`Vendor: ${vendor.name}`);

  console.log("\nDatabase seed completed successfully.");
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });

