-- CreateTable
CREATE TABLE `DaySet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Word` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `daySetId` INTEGER NOT NULL,
    `english` VARCHAR(100) NOT NULL,
    `meaning` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `Word_daySetId_english_key`(`daySetId`, `english`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Synonym` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `wordId` INTEGER NOT NULL,
    `text` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TestResult` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `daySetId` INTEGER NOT NULL,
    `takenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `scorePercent` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WordAnswer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `testResultId` INTEGER NOT NULL,
    `wordId` INTEGER NOT NULL,
    `mainCorrect` BOOLEAN NOT NULL,
    `synonymsCorrect` INTEGER NOT NULL,
    `synonymsTotal` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Word` ADD CONSTRAINT `Word_daySetId_fkey` FOREIGN KEY (`daySetId`) REFERENCES `DaySet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Synonym` ADD CONSTRAINT `Synonym_wordId_fkey` FOREIGN KEY (`wordId`) REFERENCES `Word`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TestResult` ADD CONSTRAINT `TestResult_daySetId_fkey` FOREIGN KEY (`daySetId`) REFERENCES `DaySet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WordAnswer` ADD CONSTRAINT `WordAnswer_testResultId_fkey` FOREIGN KEY (`testResultId`) REFERENCES `TestResult`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WordAnswer` ADD CONSTRAINT `WordAnswer_wordId_fkey` FOREIGN KEY (`wordId`) REFERENCES `Word`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
