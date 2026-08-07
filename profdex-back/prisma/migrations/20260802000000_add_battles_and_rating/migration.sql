-- AlterTable
ALTER TABLE "users" ADD COLUMN "battle_rating" INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE "users" ADD COLUMN "battle_wins" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "battle_losses" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "battle_draws" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "battles" (
    "id" TEXT NOT NULL,
    "pair_key" TEXT NOT NULL,
    "player_a_id" TEXT NOT NULL,
    "player_b_id" TEXT NOT NULL,
    "professor_a_id" TEXT NOT NULL,
    "professor_b_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "winner_id" TEXT,
    "rating_delta_a" INTEGER,
    "rating_delta_b" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "battles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "users_battle_rating_idx" ON "users"("battle_rating" DESC);

-- CreateIndex
CREATE INDEX "battles_pair_key_finished_at_idx" ON "battles"("pair_key", "finished_at");

-- AddForeignKey
ALTER TABLE "battles" ADD CONSTRAINT "battles_player_a_id_fkey" FOREIGN KEY ("player_a_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battles" ADD CONSTRAINT "battles_player_b_id_fkey" FOREIGN KEY ("player_b_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battles" ADD CONSTRAINT "battles_professor_a_id_fkey" FOREIGN KEY ("professor_a_id") REFERENCES "professors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battles" ADD CONSTRAINT "battles_professor_b_id_fkey" FOREIGN KEY ("professor_b_id") REFERENCES "professors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
