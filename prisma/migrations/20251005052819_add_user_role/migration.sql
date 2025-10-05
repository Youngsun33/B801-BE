-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "hp" INTEGER NOT NULL,
    "energy" INTEGER NOT NULL,
    "gold" INTEGER NOT NULL,
    "attack_power" INTEGER NOT NULL,
    "current_day" INTEGER NOT NULL,
    "is_alive" BOOLEAN NOT NULL DEFAULT true,
    "role" TEXT NOT NULL DEFAULT 'user'
);
INSERT INTO "new_users" ("attack_power", "current_day", "energy", "gold", "hp", "id", "is_alive", "password", "username") SELECT "attack_power", "current_day", "energy", "gold", "hp", "id", "is_alive", "password", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
