-- CreateTable
CREATE TABLE "user_checkpoints" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "node_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "hp" INTEGER NOT NULL,
    "energy" INTEGER NOT NULL,
    "gold" INTEGER NOT NULL,
    "saved_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_checkpoints_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
