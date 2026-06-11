-- Add pickup_snapshot column
ALTER TABLE `orders` ADD COLUMN `pickup_snapshot` TEXT NULL;

-- Migrate pickup orders: copy store info into pickup_snapshot before dropping stores
UPDATE `orders` o
INNER JOIN `stores` s ON o.`store_id` = s.`id`
SET o.`pickup_snapshot` = JSON_OBJECT(
  'name', s.`name`,
  'address', s.`address`,
  'phone', s.`phone`
)
WHERE o.`delivery_type` = 'pickup';

-- Drop foreign key and store_id from orders
ALTER TABLE `orders` DROP FOREIGN KEY `orders_store_id_fkey`;
ALTER TABLE `orders` DROP INDEX `orders_store_id_idx`;
ALTER TABLE `orders` DROP COLUMN `store_id`;

-- Drop product_stores and stores tables
DROP TABLE `product_stores`;
DROP TABLE `stores`;
