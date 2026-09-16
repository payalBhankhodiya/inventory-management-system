CREATE TYPE "public"."organization_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."site_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."department_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."storage_area_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."storage_unit_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."storage_unit_type" AS ENUM('RACK', 'SHELF', 'CABINET', 'BIN', 'LOCKER', 'DRAWER', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."item_category_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."unit_of_measure_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."item_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."item_type" AS ENUM('CONSUMABLE', 'ASSET');--> statement-breakpoint
CREATE TYPE "public"."vendor_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."asset_condition" AS ENUM('NEW', 'GOOD', 'FAIR', 'DAMAGED');--> statement-breakpoint
CREATE TYPE "public"."asset_status" AS ENUM('AVAILABLE', 'ASSIGNED', 'IN_TRANSIT', 'UNDER_MAINTENANCE', 'DAMAGED', 'LOST', 'DISPOSED');--> statement-breakpoint
CREATE TYPE "public"."stock_transaction_type" AS ENUM('RECEIPT', 'ISSUE', 'TRANSFER', 'RETURN', 'ADJUSTMENT', 'DISPOSAL');--> statement-breakpoint
CREATE TYPE "public"."assignment_status" AS ENUM('ASSIGNED', 'RETURNED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."transfer_status" AS ENUM('DRAFT', 'REQUESTED', 'APPROVED', 'IN_TRANSIT', 'COMPLETED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."return_status" AS ENUM('RECEIVED', 'INSPECTED', 'COMPLETED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."maintenance_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."maintenance_status" AS ENUM('OPEN', 'IN_PROGRESS', 'WAITING_FOR_PARTS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."disposal_method" AS ENUM('SCRAP', 'RECYCLE', 'SELL', 'DONATE', 'DESTROY', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('LOW_STOCK', 'TRANSFER_REQUESTED', 'TRANSFER_APPROVED', 'TRANSFER_COMPLETED', 'ASSET_ASSIGNED', 'ASSET_RETURNED', 'MAINTENANCE', 'SYSTEM');--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"code" varchar(50) NOT NULL,
	"email" varchar(255),
	"phone" varchar(30),
	"address" jsonb,
	"status" "organization_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" varchar(500),
	"module" varchar(100) NOT NULL,
	"action" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_module_action_unique" UNIQUE("module","action")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(500),
	"is_system_role" boolean DEFAULT false NOT NULL,
	"status" varchar(30) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_org_name_unique" UNIQUE("organization_id","name")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_permissions_role_permission_unique" UNIQUE("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"employee_code" varchar(50),
	"role_id" uuid NOT NULL,
	"department_id" uuid,
	"site_id" uuid,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"code" varchar(50) NOT NULL,
	"is_main" boolean DEFAULT false NOT NULL,
	"address" jsonb,
	"manager_id" uuid,
	"status" "site_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sites_org_code_unique" UNIQUE("organization_id","code")
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"site_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" varchar(500),
	"manager_id" uuid,
	"status" "department_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "departments_org_code_unique" UNIQUE("organization_id","code")
);
--> statement-breakpoint
CREATE TABLE "storage_areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"site_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" varchar(500),
	"manager_id" uuid,
	"status" "storage_area_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "storage_areas_org_code_unique" UNIQUE("organization_id","code")
);
--> statement-breakpoint
CREATE TABLE "storage_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"storage_area_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" varchar(150) NOT NULL,
	"code" varchar(50) NOT NULL,
	"type" "storage_unit_type" NOT NULL,
	"description" varchar(500),
	"capacity" integer,
	"status" "storage_unit_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "storage_units_org_code_unique" UNIQUE("organization_id","code")
);
--> statement-breakpoint
CREATE TABLE "item_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" varchar(500),
	"parent_id" uuid,
	"status" "item_category_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "item_categories_org_code_unique" UNIQUE("organization_id","code")
);
--> statement-breakpoint
CREATE TABLE "units_of_measure" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(30) NOT NULL,
	"description" varchar(500),
	"status" "unit_of_measure_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "units_of_measure_org_code_unique" UNIQUE("organization_id","code")
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"unit_of_measure_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"code" varchar(50) NOT NULL,
	"sku" varchar(100) NOT NULL,
	"description" varchar(1000),
	"brand" varchar(100),
	"model" varchar(100),
	"item_type" "item_type" NOT NULL,
	"is_trackable" boolean DEFAULT false NOT NULL,
	"is_serialized" boolean DEFAULT false NOT NULL,
	"is_batch_tracked" boolean DEFAULT false NOT NULL,
	"minimum_stock" numeric(12, 2),
	"maximum_stock" numeric(12, 2),
	"reorder_level" numeric(12, 2),
	"status" "item_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "items_org_code_unique" UNIQUE("organization_id","code"),
	CONSTRAINT "items_org_sku_unique" UNIQUE("organization_id","sku")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"code" varchar(50) NOT NULL,
	"contact_person" varchar(150),
	"email" varchar(255),
	"phone" varchar(30),
	"address" jsonb,
	"tax_number" varchar(100),
	"status" "vendor_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendors_org_code_unique" UNIQUE("organization_id","code")
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"asset_tag" varchar(100) NOT NULL,
	"serial_number" varchar(150),
	"barcode" varchar(150),
	"vendor_id" uuid,
	"purchase_date" date,
	"purchase_price" numeric(14, 2),
	"warranty_start_date" date,
	"warranty_end_date" date,
	"condition" "asset_condition" DEFAULT 'NEW' NOT NULL,
	"status" "asset_status" DEFAULT 'AVAILABLE' NOT NULL,
	"site_id" uuid,
	"department_id" uuid,
	"storage_area_id" uuid,
	"storage_unit_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assets_asset_tag_unique" UNIQUE("asset_tag")
);
--> statement-breakpoint
CREATE TABLE "inventories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"storage_area_id" uuid NOT NULL,
	"storage_unit_id" uuid NOT NULL,
	"quantity" numeric(14, 2) DEFAULT '0' NOT NULL,
	"reserved_quantity" numeric(14, 2) DEFAULT '0' NOT NULL,
	"available_quantity" numeric(14, 2) DEFAULT '0' NOT NULL,
	"minimum_stock" numeric(14, 2),
	"reorder_level" numeric(14, 2),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventories_location_item_unique" UNIQUE("organization_id","item_id","storage_area_id","storage_unit_id")
);
--> statement-breakpoint
CREATE TABLE "stock_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"transaction_no" varchar(100) NOT NULL,
	"type" "stock_transaction_type" NOT NULL,
	"reference_type" varchar(100),
	"reference_id" uuid,
	"reason" varchar(500),
	"remarks" varchar(1000),
	"performed_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_transactions_transaction_no_unique" UNIQUE("transaction_no")
);
--> statement-breakpoint
CREATE TABLE "stock_transaction_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stock_transaction_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"from_storage_area_id" uuid,
	"from_storage_unit_id" uuid,
	"to_storage_area_id" uuid,
	"to_storage_unit_id" uuid,
	"quantity" numeric(14, 2) NOT NULL,
	"unit_cost" numeric(14, 2),
	"remarks" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"assigned_to_user_id" uuid NOT NULL,
	"assigned_by_user_id" uuid NOT NULL,
	"department_id" uuid,
	"site_id" uuid,
	"assigned_at" timestamp with time zone NOT NULL,
	"expected_return_date" timestamp with time zone,
	"returned_at" timestamp with time zone,
	"condition_at_assignment" "asset_condition",
	"condition_at_return" "asset_condition",
	"remarks" varchar(1000),
	"status" "assignment_status" DEFAULT 'ASSIGNED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"reference_no" varchar(100) NOT NULL,
	"from_storage_area_id" uuid NOT NULL,
	"from_storage_unit_id" uuid NOT NULL,
	"to_storage_area_id" uuid NOT NULL,
	"to_storage_unit_id" uuid NOT NULL,
	"requested_by" uuid NOT NULL,
	"approved_by" uuid,
	"transfer_date" timestamp with time zone,
	"status" "transfer_status" DEFAULT 'DRAFT' NOT NULL,
	"reason" varchar(500),
	"remarks" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transfers_reference_no_unique" UNIQUE("reference_no")
);
--> statement-breakpoint
CREATE TABLE "transfer_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transfer_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"asset_id" uuid,
	"quantity" numeric(14, 2) NOT NULL,
	"remarks" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "returns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"assignment_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"returned_by_user_id" uuid NOT NULL,
	"received_by_user_id" uuid NOT NULL,
	"return_site_id" uuid NOT NULL,
	"return_department_id" uuid,
	"return_storage_area_id" uuid,
	"return_storage_unit_id" uuid,
	"return_date" timestamp with time zone NOT NULL,
	"condition" varchar(30) NOT NULL,
	"damage_description" varchar(1000),
	"remarks" varchar(1000),
	"status" "return_status" DEFAULT 'RECEIVED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"reported_by" uuid NOT NULL,
	"vendor_id" uuid,
	"issue" varchar(300) NOT NULL,
	"description" varchar(1000),
	"priority" "maintenance_priority" DEFAULT 'MEDIUM' NOT NULL,
	"start_date" timestamp with time zone,
	"expected_completion_date" timestamp with time zone,
	"completed_date" timestamp with time zone,
	"cost" numeric(14, 2),
	"resolution" varchar(1000),
	"status" "maintenance_status" DEFAULT 'OPEN' NOT NULL,
	"remarks" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"reason" varchar(500) NOT NULL,
	"disposal_date" timestamp with time zone NOT NULL,
	"disposal_method" "disposal_method" NOT NULL,
	"approved_by" uuid NOT NULL,
	"disposed_by" uuid NOT NULL,
	"residual_value" numeric(14, 2),
	"remarks" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" uuid,
	"old_value" jsonb,
	"new_value" jsonb,
	"ip_address" "inet",
	"user_agent" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" varchar(1000) NOT NULL,
	"entity_type" varchar(100),
	"entity_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_areas" ADD CONSTRAINT "storage_areas_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_areas" ADD CONSTRAINT "storage_areas_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_areas" ADD CONSTRAINT "storage_areas_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_units" ADD CONSTRAINT "storage_units_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_units" ADD CONSTRAINT "storage_units_storage_area_id_storage_areas_id_fk" FOREIGN KEY ("storage_area_id") REFERENCES "public"."storage_areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_categories" ADD CONSTRAINT "item_categories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units_of_measure" ADD CONSTRAINT "units_of_measure_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_category_id_item_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."item_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_unit_of_measure_id_units_of_measure_id_fk" FOREIGN KEY ("unit_of_measure_id") REFERENCES "public"."units_of_measure"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_storage_area_id_storage_areas_id_fk" FOREIGN KEY ("storage_area_id") REFERENCES "public"."storage_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_storage_unit_id_storage_units_id_fk" FOREIGN KEY ("storage_unit_id") REFERENCES "public"."storage_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_storage_area_id_storage_areas_id_fk" FOREIGN KEY ("storage_area_id") REFERENCES "public"."storage_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_storage_unit_id_storage_units_id_fk" FOREIGN KEY ("storage_unit_id") REFERENCES "public"."storage_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transaction_items" ADD CONSTRAINT "stock_transaction_items_stock_transaction_id_stock_transactions_id_fk" FOREIGN KEY ("stock_transaction_id") REFERENCES "public"."stock_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transaction_items" ADD CONSTRAINT "stock_transaction_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transaction_items" ADD CONSTRAINT "stock_transaction_items_from_storage_area_id_storage_areas_id_fk" FOREIGN KEY ("from_storage_area_id") REFERENCES "public"."storage_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transaction_items" ADD CONSTRAINT "stock_transaction_items_from_storage_unit_id_storage_units_id_fk" FOREIGN KEY ("from_storage_unit_id") REFERENCES "public"."storage_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transaction_items" ADD CONSTRAINT "stock_transaction_items_to_storage_area_id_storage_areas_id_fk" FOREIGN KEY ("to_storage_area_id") REFERENCES "public"."storage_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transaction_items" ADD CONSTRAINT "stock_transaction_items_to_storage_unit_id_storage_units_id_fk" FOREIGN KEY ("to_storage_unit_id") REFERENCES "public"."storage_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_assigned_to_user_id_users_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_assigned_by_user_id_users_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_storage_area_id_storage_areas_id_fk" FOREIGN KEY ("from_storage_area_id") REFERENCES "public"."storage_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_storage_unit_id_storage_units_id_fk" FOREIGN KEY ("from_storage_unit_id") REFERENCES "public"."storage_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_storage_area_id_storage_areas_id_fk" FOREIGN KEY ("to_storage_area_id") REFERENCES "public"."storage_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_storage_unit_id_storage_units_id_fk" FOREIGN KEY ("to_storage_unit_id") REFERENCES "public"."storage_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_items" ADD CONSTRAINT "transfer_items_transfer_id_transfers_id_fk" FOREIGN KEY ("transfer_id") REFERENCES "public"."transfers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_items" ADD CONSTRAINT "transfer_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_items" ADD CONSTRAINT "transfer_items_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_returned_by_user_id_users_id_fk" FOREIGN KEY ("returned_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_received_by_user_id_users_id_fk" FOREIGN KEY ("received_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_return_site_id_sites_id_fk" FOREIGN KEY ("return_site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_return_department_id_departments_id_fk" FOREIGN KEY ("return_department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_return_storage_area_id_storage_areas_id_fk" FOREIGN KEY ("return_storage_area_id") REFERENCES "public"."storage_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_return_storage_unit_id_storage_units_id_fk" FOREIGN KEY ("return_storage_unit_id") REFERENCES "public"."storage_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disposals" ADD CONSTRAINT "disposals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disposals" ADD CONSTRAINT "disposals_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disposals" ADD CONSTRAINT "disposals_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disposals" ADD CONSTRAINT "disposals_disposed_by_users_id_fk" FOREIGN KEY ("disposed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "users_organization_id_idx" ON "users" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "users_role_id_idx" ON "users" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "users_department_id_idx" ON "users" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "users_site_id_idx" ON "users" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "sites_organization_id_idx" ON "sites" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sites_manager_id_idx" ON "sites" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "departments_organization_id_idx" ON "departments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "departments_site_id_idx" ON "departments" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "departments_manager_id_idx" ON "departments" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "storage_areas_organization_id_idx" ON "storage_areas" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "storage_areas_site_id_idx" ON "storage_areas" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "storage_areas_department_id_idx" ON "storage_areas" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "storage_areas_manager_id_idx" ON "storage_areas" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "item_categories_organization_id_idx" ON "item_categories" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "item_categories_parent_id_idx" ON "item_categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "units_of_measure_organization_id_idx" ON "units_of_measure" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "items_organization_id_idx" ON "items" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "items_category_id_idx" ON "items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "items_unit_of_measure_id_idx" ON "items" USING btree ("unit_of_measure_id");--> statement-breakpoint
CREATE INDEX "items_status_idx" ON "items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vendors_organization_id_idx" ON "vendors" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "vendors_status_idx" ON "vendors" USING btree ("status");--> statement-breakpoint
CREATE INDEX "assets_organization_id_idx" ON "assets" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "assets_item_id_idx" ON "assets" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "assets_vendor_id_idx" ON "assets" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "assets_site_id_idx" ON "assets" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "assets_department_id_idx" ON "assets" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "assets_storage_area_id_idx" ON "assets" USING btree ("storage_area_id");--> statement-breakpoint
CREATE INDEX "assets_storage_unit_id_idx" ON "assets" USING btree ("storage_unit_id");--> statement-breakpoint
CREATE INDEX "assets_status_idx" ON "assets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inventories_organization_id_idx" ON "inventories" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "inventories_item_id_idx" ON "inventories" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "inventories_storage_area_id_idx" ON "inventories" USING btree ("storage_area_id");--> statement-breakpoint
CREATE INDEX "inventories_storage_unit_id_idx" ON "inventories" USING btree ("storage_unit_id");--> statement-breakpoint
CREATE INDEX "stock_transactions_organization_id_idx" ON "stock_transactions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "stock_transactions_performed_by_idx" ON "stock_transactions" USING btree ("performed_by");--> statement-breakpoint
CREATE INDEX "stock_transactions_type_idx" ON "stock_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "stock_transactions_created_at_idx" ON "stock_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "stock_transaction_items_transaction_id_idx" ON "stock_transaction_items" USING btree ("stock_transaction_id");--> statement-breakpoint
CREATE INDEX "stock_transaction_items_item_id_idx" ON "stock_transaction_items" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "stock_transaction_items_from_area_id_idx" ON "stock_transaction_items" USING btree ("from_storage_area_id");--> statement-breakpoint
CREATE INDEX "stock_transaction_items_from_unit_id_idx" ON "stock_transaction_items" USING btree ("from_storage_unit_id");--> statement-breakpoint
CREATE INDEX "stock_transaction_items_to_area_id_idx" ON "stock_transaction_items" USING btree ("to_storage_area_id");--> statement-breakpoint
CREATE INDEX "stock_transaction_items_to_unit_id_idx" ON "stock_transaction_items" USING btree ("to_storage_unit_id");--> statement-breakpoint
CREATE INDEX "assignments_organization_id_idx" ON "assignments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "assignments_asset_id_idx" ON "assignments" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "assignments_assigned_to_user_id_idx" ON "assignments" USING btree ("assigned_to_user_id");--> statement-breakpoint
CREATE INDEX "assignments_assigned_by_user_id_idx" ON "assignments" USING btree ("assigned_by_user_id");--> statement-breakpoint
CREATE INDEX "assignments_department_id_idx" ON "assignments" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "assignments_site_id_idx" ON "assignments" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "assignments_status_idx" ON "assignments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transfers_organization_id_idx" ON "transfers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "transfers_from_storage_area_id_idx" ON "transfers" USING btree ("from_storage_area_id");--> statement-breakpoint
CREATE INDEX "transfers_from_storage_unit_id_idx" ON "transfers" USING btree ("from_storage_unit_id");--> statement-breakpoint
CREATE INDEX "transfers_to_storage_area_id_idx" ON "transfers" USING btree ("to_storage_area_id");--> statement-breakpoint
CREATE INDEX "transfers_to_storage_unit_id_idx" ON "transfers" USING btree ("to_storage_unit_id");--> statement-breakpoint
CREATE INDEX "transfers_requested_by_idx" ON "transfers" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "transfers_approved_by_idx" ON "transfers" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX "transfers_status_idx" ON "transfers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transfer_items_transfer_id_idx" ON "transfer_items" USING btree ("transfer_id");--> statement-breakpoint
CREATE INDEX "transfer_items_item_id_idx" ON "transfer_items" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "transfer_items_asset_id_idx" ON "transfer_items" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "returns_organization_id_idx" ON "returns" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "returns_assignment_id_idx" ON "returns" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "returns_asset_id_idx" ON "returns" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "returns_returned_by_user_id_idx" ON "returns" USING btree ("returned_by_user_id");--> statement-breakpoint
CREATE INDEX "returns_received_by_user_id_idx" ON "returns" USING btree ("received_by_user_id");--> statement-breakpoint
CREATE INDEX "returns_return_site_id_idx" ON "returns" USING btree ("return_site_id");--> statement-breakpoint
CREATE INDEX "returns_status_idx" ON "returns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "maintenances_organization_id_idx" ON "maintenances" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "maintenances_asset_id_idx" ON "maintenances" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "maintenances_reported_by_idx" ON "maintenances" USING btree ("reported_by");--> statement-breakpoint
CREATE INDEX "maintenances_vendor_id_idx" ON "maintenances" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "maintenances_status_idx" ON "maintenances" USING btree ("status");--> statement-breakpoint
CREATE INDEX "maintenances_priority_idx" ON "maintenances" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "disposals_organization_id_idx" ON "disposals" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "disposals_asset_id_idx" ON "disposals" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "disposals_approved_by_idx" ON "disposals" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX "disposals_disposed_by_idx" ON "disposals" USING btree ("disposed_by");--> statement-breakpoint
CREATE INDEX "disposals_disposal_date_idx" ON "disposals" USING btree ("disposal_date");--> statement-breakpoint
CREATE INDEX "audit_logs_organization_id_idx" ON "audit_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_type_id_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_organization_id_idx" ON "notifications" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_entity_type_id_idx" ON "notifications" USING btree ("entity_type","entity_id");