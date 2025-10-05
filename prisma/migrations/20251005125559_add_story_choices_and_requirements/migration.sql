-- CreateTable
CREATE TABLE "story_choices" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "story_node_id" INTEGER NOT NULL,
    "choice_text" TEXT NOT NULL,
    "target_node_id" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "story_choices_story_node_id_fkey" FOREIGN KEY ("story_node_id") REFERENCES "main_stories" ("node_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "choice_requirements" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "choice_id" INTEGER NOT NULL,
    "requirement_type" TEXT NOT NULL,
    "requirement_id" INTEGER,
    "requirement_value" INTEGER,
    "operator" TEXT NOT NULL DEFAULT '>=',
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "choice_requirements_choice_id_fkey" FOREIGN KEY ("choice_id") REFERENCES "story_choices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
