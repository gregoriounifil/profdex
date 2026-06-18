-- AlterTable
ALTER TABLE "professors" ADD COLUMN "capture_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "professors_capture_token_key" ON "professors"("capture_token");
