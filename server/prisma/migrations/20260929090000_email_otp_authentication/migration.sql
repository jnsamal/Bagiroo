ALTER TABLE `User` MODIFY `phone` VARCHAR(191) NULL;

ALTER TABLE `OtpToken`
  MODIFY `phone` VARCHAR(191) NULL,
  ADD COLUMN `email` VARCHAR(191) NULL;

CREATE INDEX `OtpToken_email_purpose_idx` ON `OtpToken`(`email`, `purpose`);
