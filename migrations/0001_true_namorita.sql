ALTER TABLE "appointments" ADD COLUMN "doctor_name" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "doctor_specialty" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "diagnosis" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "treatment" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "prescriptions" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "follow_up_date" timestamp;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "doctor_notes" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "vitals" json DEFAULT '{}'::json;