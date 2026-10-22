CREATE TABLE orders (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_id INT UNSIGNED NOT NULL,
    shop_id INT UNSIGNED NOT NULL,
    table_number INT NULL,
    order_type ENUM('Manual', 'Dine-In', 'Delivery', 'Takeaway') NOT NULL,
    payment_status ENUM('Pending', 'Paid') NOT NULL DEFAULT 'Pending',
    order_status ENUM('Pending', 'Accepted', 'Preparing', 'Ready', 'Served', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    special_instruction VARCHAR(255) NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method ENUM('Cash', 'UPI', 'Card') NULL,
    token_number VARCHAR(20) NULL,
    delivery_address VARCHAR(500) NULL,
    delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    delivery_landmark VARCHAR(255) NULL,
    distance_km DECIMAL(8,2) NULL,
    distance_source VARCHAR(50) NULL,
    cashback_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    cashback_status ENUM('Pending', 'Paid') NOT NULL DEFAULT 'Pending',
    cashback_paid_by INT UNSIGNED NULL,
    cashback_paid_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY ix_orders_customer_id (customer_id),
    KEY ix_orders_shop_id (shop_id),
    KEY ix_orders_status_created_at (order_status, created_at),
    KEY ix_orders_payment_created_at (payment_status, created_at),
    KEY ix_orders_order_type_created_at (order_type, created_at),
    KEY ix_orders_token_number (token_number),
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_orders_shop_settings FOREIGN KEY (shop_id) REFERENCES shop_settings (id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_orders_cashback_staff FOREIGN KEY (cashback_paid_by) REFERENCES staff (id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE order_items (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id INT UNSIGNED NOT NULL,
    menu_id INT UNSIGNED NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id),
    KEY ix_order_items_order_id (order_id),
    KEY ix_order_items_menu_id (menu_id),
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_order_items_menu FOREIGN KEY (menu_id) REFERENCES menu (id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
