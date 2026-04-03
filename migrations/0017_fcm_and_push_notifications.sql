CREATE TYPE "public"."fcm_device_type_enum" AS ENUM('ios', 'android', 'web');
CREATE TYPE "public"."push_message_type_enum" AS ENUM('glucose_alert', 'inactivity_alert');

CREATE TABLE "users_fcm_tokens" (
	"user_id" varchar NOT NULL,
	"token" text NOT NULL,
	"device_type" "fcm_device_type_enum" NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT "users_fcm_tokens_user_id_token_device_type_pk" PRIMARY KEY("user_id","token","device_type")
);

ALTER TABLE "users_fcm_tokens" ADD CONSTRAINT "users_fcm_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "idx_users_fcm_tokens_user_id" ON "users_fcm_tokens" USING btree ("user_id");

CREATE TABLE "user_push_notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"message_type" "push_message_type_enum" NOT NULL,
	"payload" jsonb,
	"created_at" timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE "user_push_notifications" ADD CONSTRAINT "user_push_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "idx_user_push_notifications_user_created" ON "user_push_notifications" USING btree ("user_id", "created_at" DESC);
