-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "hp" INTEGER NOT NULL,
    "energy" INTEGER NOT NULL,
    "gold" INTEGER NOT NULL,
    "attack_power" INTEGER NOT NULL,
    "current_day" INTEGER NOT NULL,
    "is_alive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "story_progress" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "current_chapter" INTEGER NOT NULL,
    "last_node_id" INTEGER NOT NULL,
    "investigation_count" INTEGER NOT NULL,
    "checkpoint_count" INTEGER NOT NULL DEFAULT 0,
    "story_type" TEXT NOT NULL DEFAULT 'random',
    CONSTRAINT "story_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "inventory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "inventory_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "raid_teams" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "day" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "boss_id" INTEGER NOT NULL,
    CONSTRAINT "raid_teams_boss_id_fkey" FOREIGN KEY ("boss_id") REFERENCES "bosses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "team_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "raid_teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "raid_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "team_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "raid_items_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "raid_teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "raid_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bosses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "hp" INTEGER NOT NULL,
    "skills" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "abilities" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "effect_type" TEXT NOT NULL,
    "effect_value" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "user_abilities" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "ability_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "obtained_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_abilities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_abilities_ability_id_fkey" FOREIGN KEY ("ability_id") REFERENCES "abilities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ability_trades" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "from_user_id" INTEGER NOT NULL,
    "to_user_id" INTEGER NOT NULL,
    "from_ability_id" INTEGER NOT NULL,
    "to_ability_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ability_trades_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ability_trades_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ability_trades_from_ability_id_fkey" FOREIGN KEY ("from_ability_id") REFERENCES "abilities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
