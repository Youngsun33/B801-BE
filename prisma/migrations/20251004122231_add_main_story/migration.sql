-- CreateTable
CREATE TABLE "main_stories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "node_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "node_type" TEXT NOT NULL,
    "route_name" TEXT,
    "choices" TEXT NOT NULL,
    "rewards" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "main_stories_node_id_key" ON "main_stories"("node_id");
