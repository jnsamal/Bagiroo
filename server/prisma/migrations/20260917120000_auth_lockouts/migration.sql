CREATE TABLE `AuthLockout` (
    `id` VARCHAR(191) NOT NULL,
    `lockKey` VARCHAR(191) NOT NULL,
    `failureCount` INTEGER NOT NULL DEFAULT 0,
    `lockedUntil` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AuthLockout_lockKey_key`(`lockKey`),
    INDEX `AuthLockout_lockedUntil_idx`(`lockedUntil`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
