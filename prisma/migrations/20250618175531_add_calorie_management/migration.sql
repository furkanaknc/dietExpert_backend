-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'OTHER');

-- CreateTable
CREATE TABLE "FoodEntry" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "message_id" TEXT,
    "food_name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "calories" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION,
    "carbs" DOUBLE PRECISION,
    "fat" DOUBLE PRECISION,
    "fiber" DOUBLE PRECISION,
    "sugar" DOUBLE PRECISION,
    "sodium" DOUBLE PRECISION,
    "meal_type" "MealType",
    "consumed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCalorieSummary" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_calories" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_protein" DOUBLE PRECISION DEFAULT 0,
    "total_carbs" DOUBLE PRECISION DEFAULT 0,
    "total_fat" DOUBLE PRECISION DEFAULT 0,
    "total_fiber" DOUBLE PRECISION DEFAULT 0,
    "total_sugar" DOUBLE PRECISION DEFAULT 0,
    "total_sodium" DOUBLE PRECISION DEFAULT 0,
    "goal_calories" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyCalorieSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FoodEntry_user_id_idx" ON "FoodEntry"("user_id");

-- CreateIndex
CREATE INDEX "FoodEntry_consumed_at_idx" ON "FoodEntry"("consumed_at");

-- CreateIndex
CREATE INDEX "FoodEntry_user_id_consumed_at_idx" ON "FoodEntry"("user_id", "consumed_at");

-- CreateIndex
CREATE INDEX "DailyCalorieSummary_user_id_idx" ON "DailyCalorieSummary"("user_id");

-- CreateIndex
CREATE INDEX "DailyCalorieSummary_date_idx" ON "DailyCalorieSummary"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCalorieSummary_user_id_date_key" ON "DailyCalorieSummary"("user_id", "date");

-- AddForeignKey
ALTER TABLE "FoodEntry" ADD CONSTRAINT "FoodEntry_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodEntry" ADD CONSTRAINT "FoodEntry_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCalorieSummary" ADD CONSTRAINT "DailyCalorieSummary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
