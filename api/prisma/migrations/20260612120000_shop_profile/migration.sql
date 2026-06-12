CREATE TABLE `shop_profiles` (
  `id` INTEGER NOT NULL DEFAULT 1,
  `name` VARCHAR(128) NOT NULL,
  `cover_image` VARCHAR(512) NULL,
  `address` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(32) NOT NULL,
  `latitude` DECIMAL(10, 7) NULL,
  `longitude` DECIMAL(10, 7) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
