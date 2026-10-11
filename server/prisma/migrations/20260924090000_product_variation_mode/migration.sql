ALTER TABLE `Product` ADD COLUMN `hasColorVariations` BOOLEAN NOT NULL DEFAULT false;

UPDATE `Product`
SET `hasColorVariations` = true
WHERE EXISTS (
  SELECT 1 FROM `ProductVariation` WHERE `ProductVariation`.`productId` = `Product`.`id`
);
