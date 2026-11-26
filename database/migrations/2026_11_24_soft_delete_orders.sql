-- Run once on the correct DokaanSathi database after taking a backup.
-- Existing orders and all related records remain untouched.
ALTER TABLE orders
    ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN deleted_at DATETIME NULL,
    ADD COLUMN deleted_by INT NULL,
    ADD COLUMN deleted_by_role VARCHAR(20) NULL;

CREATE INDEX idx_orders_is_deleted_status
    ON orders (is_deleted, order_status);
