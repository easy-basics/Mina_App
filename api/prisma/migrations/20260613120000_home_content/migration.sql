CREATE TABLE `home_banners` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `image_url` VARCHAR(512) NOT NULL,
  `link_url` VARCHAR(512) NULL,
  `sort` INTEGER NOT NULL DEFAULT 0,
  `enabled` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `brand_intro` (
  `id` INTEGER NOT NULL DEFAULT 1,
  `home_cover_image` VARCHAR(512) NULL,
  `home_summary` TEXT NOT NULL,
  `intro_hero_image` VARCHAR(512) NULL,
  `brand_name` VARCHAR(128) NOT NULL,
  `brand_subtitle` VARCHAR(255) NULL,
  `show_intro_button` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `brand_intro_sections` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(64) NOT NULL,
  `body` TEXT NOT NULL,
  `tags` VARCHAR(255) NULL,
  `sort` INTEGER NOT NULL DEFAULT 0,
  `enabled` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
