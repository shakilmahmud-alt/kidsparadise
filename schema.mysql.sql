-- KidsParadise MySQL Database Schema for phpMyAdmin / cPanel
-- Character set: utf8mb4, Engine: InnoDB

CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(191) NULL,
  `role` ENUM('admin', 'customer') DEFAULT 'customer',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(191) UNIQUE,
  `image_url` TEXT NULL,
  `parent_id` BIGINT NULL,
  `item_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `brands` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(191) UNIQUE,
  `logo_url` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(191) UNIQUE,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `original_price` DECIMAL(10,2) NULL,
  `category` VARCHAR(255) NULL,
  `brand` VARCHAR(255) NULL,
  `unit` VARCHAR(100) NULL,
  `sku` VARCHAR(100) NULL,
  `images` JSON NULL,
  `image_url` TEXT NULL,
  `short_description` TEXT NULL,
  `description` LONGTEXT NULL,
  `badge` VARCHAR(100) NULL,
  `is_featured` TINYINT(1) DEFAULT 0,
  `stock` INT DEFAULT 100,
  `variants` JSON NULL,
  `filter_attributes` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Run this command in phpMyAdmin if updating an existing database:
-- ALTER TABLE products ADD COLUMN stock INT DEFAULT 100 AFTER is_featured;

CREATE TABLE IF NOT EXISTS `attributes` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL UNIQUE,
  `values_list` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `coupons` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(100) NOT NULL UNIQUE,
  `discount_type` ENUM('Fixed', 'Percentage') DEFAULT 'Fixed',
  `discount_value` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `minimum_spend` DECIMAL(10,2) DEFAULT 0.00,
  `expiry_date` VARCHAR(50) NULL,
  `status` ENUM('Active', 'Inactive') DEFAULT 'Active',
  `auto_apply` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_email` VARCHAR(191) NULL,
  `customer_phone` VARCHAR(50) NULL,
  `customer_address` TEXT NULL,
  `customer_district` VARCHAR(100) NULL,
  `customer_area` VARCHAR(100) NULL,
  `subtotal` DECIMAL(10,2) DEFAULT 0.00,
  `shipping_cost` DECIMAL(10,2) DEFAULT 0.00,
  `discount` DECIMAL(10,2) DEFAULT 0.00,
  `total` DECIMAL(10,2) DEFAULT 0.00,
  `status` ENUM('Pending', 'Processing', 'Delivered', 'Cancelled') DEFAULT 'Pending',
  `items` JSON NULL,
  `coupon_code` VARCHAR(100) NULL,
  `user_id` BIGINT NULL,
  `payment_method` VARCHAR(100) DEFAULT 'Cash on Delivery',
  `payment_status` VARCHAR(50) DEFAULT 'Unpaid',
  `date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reviews` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `product_id` BIGINT NOT NULL,
  `product_name` VARCHAR(255) NULL,
  `author_name` VARCHAR(191) NOT NULL,
  `rating` INT NOT NULL DEFAULT 5,
  `comment` TEXT NULL,
  `reply` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `addresses` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `full_name` VARCHAR(191) NULL,
  `phone` VARCHAR(50) NULL,
  `address_line` TEXT NULL,
  `district` VARCHAR(100) NULL,
  `area` VARCHAR(100) NULL,
  `is_default` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wishlist` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `product_id` BIGINT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `user_product` (`user_id`, `product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pages` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(191) UNIQUE NOT NULL,
  `content` JSON NULL,
  `status` VARCHAR(50) DEFAULT 'Published',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `settings` (
  `key_name` VARCHAR(191) PRIMARY KEY,
  `value_data` JSON NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default Settings
INSERT INTO `settings` (`key_name`, `value_data`) VALUES
('shipping_fees', '{"insideDhaka": 60, "outsideDhaka": 120}')
ON DUPLICATE KEY UPDATE `key_name`=`key_name`;

-- Insert Default Admin User (Password: admin123)
-- bcrypt hash for 'admin123' is $2a$10$wK1VqJk8z9uK1aM7Jt90hOmU.F0Kvh2LqD9H4v8lQhK7Jq7N5XqKu (or generated by backend)
INSERT INTO `users` (`email`, `password_hash`, `full_name`, `role`) VALUES
('admin@kidsparadise.com.bd', '$2a$10$wK1VqJk8z9uK1aM7Jt90hOmU.F0Kvh2LqD9H4v8lQhK7Jq7N5XqKu', 'Super Admin', 'admin')
ON DUPLICATE KEY UPDATE `email`=`email`;
