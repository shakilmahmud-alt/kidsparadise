-- KidsParadise: Automated WordPress WooCommerce to Clean MySQL Migration Script
-- INSTRUCTIONS:
-- 1. First run `schema.mysql.sql` in your phpMyAdmin database to create the new tables.
-- 2. Then run this script in the SAME database (where your WordPress wp_* tables are present).
-- 3. If your WordPress table prefix is not `wp_`, simply find & replace `wp_` with your prefix.

-- 1. Migrate Categories from WooCommerce to `categories` table
INSERT INTO `categories` (`id`, `name`, `slug`, `item_count`, `created_at`)
SELECT 
    t.term_id AS id,
    t.name AS name,
    t.slug AS slug,
    tt.count AS item_count,
    NOW() AS created_at
FROM `wp_terms` t
INNER JOIN `wp_term_taxonomy` tt ON t.term_id = tt.term_id
WHERE tt.taxonomy = 'product_cat'
ON DUPLICATE KEY UPDATE 
    `name` = VALUES(`name`),
    `slug` = VALUES(`slug`),
    `item_count` = VALUES(`item_count`);

-- 2. Migrate Products from WooCommerce to `products` table
INSERT INTO `products` (
    `id`,
    `name`,
    `slug`,
    `price`,
    `original_price`,
    `sku`,
    `short_description`,
    `description`,
    `category`,
    `image_url`,
    `images`,
    `is_featured`,
    `created_at`
)
SELECT 
    p.ID AS id,
    p.post_title AS name,
    p.post_name AS slug,
    COALESCE(CAST(pm_price.meta_value AS DECIMAL(10,2)), 0.00) AS price,
    CAST(pm_regular_price.meta_value AS DECIMAL(10,2)) AS original_price,
    pm_sku.meta_value AS sku,
    p.post_excerpt AS short_description,
    p.post_content AS description,
    cat.category_name AS category,
    att.guid AS image_url,
    IF(att.guid IS NOT NULL, JSON_ARRAY(att.guid), JSON_ARRAY()) AS images,
    IF(pm_featured.meta_value = 'yes', 1, 0) AS is_featured,
    p.post_date AS created_at
FROM `wp_posts` p

-- Price
LEFT JOIN `wp_postmeta` pm_price 
    ON p.ID = pm_price.post_id AND pm_price.meta_key = '_price'

-- Regular Price
LEFT JOIN `wp_postmeta` pm_regular_price 
    ON p.ID = pm_regular_price.post_id AND pm_regular_price.meta_key = '_regular_price'

-- SKU
LEFT JOIN `wp_postmeta` pm_sku 
    ON p.ID = pm_sku.post_id AND pm_sku.meta_key = '_sku'

-- Featured
LEFT JOIN `wp_postmeta` pm_featured 
    ON p.ID = pm_featured.post_id AND pm_featured.meta_key = '_featured'

-- Thumbnail Image
LEFT JOIN `wp_postmeta` pm_thumb 
    ON p.ID = pm_thumb.post_id AND pm_thumb.meta_key = '_thumbnail_id'
LEFT JOIN `wp_posts` att 
    ON pm_thumb.meta_value = att.ID AND att.post_type = 'attachment'

-- Category Name (Primary)
LEFT JOIN (
    SELECT 
        tr.object_id,
        t.name AS category_name
    FROM `wp_term_relationships` tr
    INNER JOIN `wp_term_taxonomy` tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
    INNER JOIN `wp_terms` t ON tt.term_id = t.term_id
    WHERE tt.taxonomy = 'product_cat'
    GROUP BY tr.object_id
) cat ON p.ID = cat.object_id

WHERE p.post_type = 'product'
  AND p.post_status = 'publish'

ON DUPLICATE KEY UPDATE 
    `name` = VALUES(`name`),
    `slug` = VALUES(`slug`),
    `price` = VALUES(`price`),
    `original_price` = VALUES(`original_price`),
    `sku` = VALUES(`sku`),
    `short_description` = VALUES(`short_description`),
    `description` = VALUES(`description`),
    `category` = VALUES(`category`),
    `image_url` = VALUES(`image_url`),
    `images` = VALUES(`images`),
    `is_featured` = VALUES(`is_featured`);
