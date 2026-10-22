CREATE TABLE alerts (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id INT UNSIGNED NOT NULL,
    user_type ENUM('owner', 'staff') NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    message VARCHAR(255) NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY ix_alerts_order_user_read_created (order_id, user_type, is_read, created_at),
    CONSTRAINT fk_alerts_order FOREIGN KEY (order_id) REFERENCES orders (id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE reviews (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id INT UNSIGNED NOT NULL,
    customer_id INT UNSIGNED NOT NULL,
    menu_id INT UNSIGNED NOT NULL,
    rating INT NOT NULL,
    review TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY ix_reviews_order_id (order_id),
    KEY ix_reviews_customer_id (customer_id),
    KEY ix_reviews_menu_id (menu_id),
    CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders (id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_reviews_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_reviews_menu FOREIGN KEY (menu_id) REFERENCES menu (id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
