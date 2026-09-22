ALTER TABLE `ProductMedia` ADD COLUMN `variationId` VARCHAR(191) NULL;
CREATE INDEX `ProductMedia_variationId_idx` ON `ProductMedia`(`variationId`);
ALTER TABLE `ProductMedia` ADD CONSTRAINT `ProductMedia_variationId_fkey` FOREIGN KEY (`variationId`) REFERENCES `ProductVariation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
