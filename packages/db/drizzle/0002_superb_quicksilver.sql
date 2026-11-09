CREATE TYPE "public"."staff_actor" AS ENUM('USER', 'SYSTEM', 'PLATFORM_OWNER', 'GUEST');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid,
	"actor_type" "staff_actor" NOT NULL,
	"actor_id" uuid,
	"entity_type" varchar(63) NOT NULL,
	"entity_id" uuid,
	"action" varchar(63) NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"reason" text,
	"correlation_id" varchar(64),
	"ip_address" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid,
	"aggregate_type" varchar(63) NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"event_type" varchar(63) NOT NULL,
	"sequence_no" bigint,
	"branch_id" uuid,
	"payload" jsonb NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"last_error" text,
	"scheduled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
