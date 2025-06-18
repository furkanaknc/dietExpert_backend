/*
  Warnings:

  - You are about to drop the column `carbs` on the `FoodEntry` table. All the data in the column will be lost.
  - You are about to drop the column `fat` on the `FoodEntry` table. All the data in the column will be lost.
  - You are about to drop the column `fiber` on the `FoodEntry` table. All the data in the column will be lost.
  - You are about to drop the column `meal_type` on the `FoodEntry` table. All the data in the column will be lost.
  - You are about to drop the column `protein` on the `FoodEntry` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `FoodEntry` table. All the data in the column will be lost.
  - You are about to drop the column `sodium` on the `FoodEntry` table. All the data in the column will be lost.
  - You are about to drop the column `sugar` on the `FoodEntry` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `FoodEntry` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FoodEntry" DROP COLUMN "carbs",
DROP COLUMN "fat",
DROP COLUMN "fiber",
DROP COLUMN "meal_type",
DROP COLUMN "protein",
DROP COLUMN "quantity",
DROP COLUMN "sodium",
DROP COLUMN "sugar",
DROP COLUMN "unit";

-- DropEnum
DROP TYPE "MealType";
