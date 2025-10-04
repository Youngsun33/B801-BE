-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user_story_abilities" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "story_ability_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "obtained_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_story_abilities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_story_abilities_story_ability_id_fkey" FOREIGN KEY ("story_ability_id") REFERENCES "story_abilities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_story_abilities" ("id", "obtained_at", "story_ability_id", "user_id") SELECT "id", "obtained_at", "story_ability_id", "user_id" FROM "user_story_abilities";
DROP TABLE "user_story_abilities";
ALTER TABLE "new_user_story_abilities" RENAME TO "user_story_abilities";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
