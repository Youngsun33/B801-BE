-- CreateTable
CREATE TABLE "random_stories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "choices" TEXT NOT NULL,
    "outcomes" TEXT NOT NULL,
    "requirements" TEXT,
    "category" TEXT
);
