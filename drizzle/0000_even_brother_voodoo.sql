CREATE TYPE "public"."rsvp_source" AS ENUM('guest', 'admin');--> statement-breakpoint
CREATE TYPE "public"."rsvp_status" AS ENUM('confirmed', 'removed');--> statement-breakpoint
CREATE TABLE "photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_url" text NOT NULL,
	"thumb_url" text NOT NULL,
	"full_pathname" text NOT NULL,
	"thumb_pathname" text NOT NULL,
	"uploaded_by" text,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rsvps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"companions_count" integer DEFAULT 0 NOT NULL,
	"message" text,
	"source" "rsvp_source" DEFAULT 'guest' NOT NULL,
	"status" "rsvp_status" DEFAULT 'confirmed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_photos_created_at" ON "photos" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_rsvps_status" ON "rsvps" USING btree ("status");