CREATE TABLE delivery_assignments (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id INT UNSIGNED NOT NULL,
    delivery_boy_id INT UNSIGNED NOT NULL,
    status ENUM('Assigned', 'Accepted', 'OutForDelivery', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Assigned',
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accepted_at DATETIME NULL,
    out_for_delivery_at DATETIME NULL,
    delivered_at DATETIME NULL,
    distance_km DECIMAL(8,2) NULL,
    PRIMARY KEY (id),
    KEY ix_delivery_assignments_order_id (order_id),
    KEY ix_delivery_assignments_staff_status (delivery_boy_id, status),
    CONSTRAINT fk_delivery_assignments_order FOREIGN KEY (order_id) REFERENCES orders (id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_delivery_assignments_staff FOREIGN KEY (delivery_boy_id) REFERENCES staff (id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE delivery_assignment_attempts (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id INT UNSIGNED NOT NULL,
    delivery_boy_id INT UNSIGNED NOT NULL,
    attempt_no INT UNSIGNED NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Assigned', 'Reminded', 'Expired') NOT NULL DEFAULT 'Assigned',
    reminded_at DATETIME NULL,
    expired_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY ix_assignment_attempts_order_attempt (order_id, attempt_no),
    KEY ix_assignment_attempts_status_reminded (status, reminded_at),
    CONSTRAINT fk_assignment_attempts_order FOREIGN KEY (order_id) REFERENCES orders (id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_assignment_attempts_staff FOREIGN KEY (delivery_boy_id) REFERENCES staff (id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE push_subscriptions (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    staff_id INT UNSIGNED NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    PRIMARY KEY (id),
    KEY ix_push_subscriptions_staff_id (staff_id),
    CONSTRAINT fk_push_subscriptions_staff FOREIGN KEY (staff_id) REFERENCES staff (id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
