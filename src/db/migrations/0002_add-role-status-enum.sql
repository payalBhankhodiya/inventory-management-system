CREATE TYPE "public"."role_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"public"."role_status";--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "status" SET DATA TYPE "public"."role_status" USING "status"::"public"."role_status";