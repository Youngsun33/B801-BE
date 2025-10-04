/*
  Warnings:

  - You are about to drop the `ability_trades` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ability_trades";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "notifications";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "story_abilities" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "user_story_abilities" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "story_ability_id" INTEGER NOT NULL,
    "obtained_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_story_abilities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_story_abilities_story_ability_id_fkey" FOREIGN KEY ("story_ability_id") REFERENCES "story_abilities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
