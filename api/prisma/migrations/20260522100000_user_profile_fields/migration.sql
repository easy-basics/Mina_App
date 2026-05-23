-- AlterTable
ALTER TABLE `users` ADD COLUMN `real_name` VARCHAR(64) NULL,
    ADD COLUMN `company_name` VARCHAR(128) NULL,
    ADD COLUMN `company_address` VARCHAR(255) NULL;
