CREATE TABLE order_tracking_capabilities (
    order_id INT UNSIGNED NOT NULL,
    tracking_token_hash CHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (order_id),
    UNIQUE KEY ix_order_tracking_capabilities_hash (tracking_token_hash),
    CONSTRAINT fk_order_tracking_capabilities_order FOREIGN KEY (order_id) REFERENCES orders (id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
