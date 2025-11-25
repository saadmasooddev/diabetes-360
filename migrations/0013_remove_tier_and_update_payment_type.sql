CREATE TYPE "payment_type" AS ENUM('monthly', 'annual', 'free');

UPDATE "users" SET "payment_type" = 'free';

ALTER TABLE "users" DROP COLUMN "tier";

