-- Existing capture tokens were committed to source control and must be
-- considered compromised. Do not migrate their plaintext values.
ALTER TABLE "professors" ADD COLUMN "capture_token_hash" TEXT;

CREATE UNIQUE INDEX "professors_capture_token_hash_key"
ON "professors"("capture_token_hash");

DROP INDEX "professors_capture_token_key";
ALTER TABLE "professors" DROP COLUMN "capture_token";
