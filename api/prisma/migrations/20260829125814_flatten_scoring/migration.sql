/*
  Warnings:

  - You are about to drop the column `mainCorrect` on the `WordAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `synonymsCorrect` on the `WordAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `synonymsTotal` on the `WordAnswer` table. All the data in the column will be lost.
  - Added the required column `correctWords` to the `WordAnswer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expectedWords` to the `WordAnswer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `missedWords` to the `WordAnswer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scorePercent` to the `WordAnswer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `WordAnswer` DROP COLUMN `mainCorrect`,
    DROP COLUMN `synonymsCorrect`,
    DROP COLUMN `synonymsTotal`,
    ADD COLUMN `correctWords` TEXT NOT NULL,
    ADD COLUMN `expectedWords` TEXT NOT NULL,
    ADD COLUMN `missedWords` TEXT NOT NULL,
    ADD COLUMN `scorePercent` DOUBLE NOT NULL;
