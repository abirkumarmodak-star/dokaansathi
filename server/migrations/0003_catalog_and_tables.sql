CREATE TABLE menu (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NULL,
    available TINYINT(1) NOT NULL DEFAULT 1,
    serving_type VARCHAR(30) NOT NULL DEFAULT 'Plate',
    serving_size VARCHAR(30) NOT NULL DEFAULT 'Full',
    display_order INT NOT NULL DEFAULT 1,
    image VARCHAR(255) NULL,
    half_price DECIMAL(10,2) NULL,
    full_price DECIMAL(10,2) NULL,
    plate_type ENUM('Full', 'Half', 'Regular') NOT NULL DEFAULT 'Regular',
    PRIMARY KEY (id),
    KEY ix_menu_category_available (category, available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE inventory (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    menu_id INT UNSIGNED NOT NULL,
    stock_quantity INT NULL,
    reorder_level INT NULL,
    opening_stock INT NOT NULL DEFAULT 0,
    current_stock INT NOT NULL DEFAULT 0,
    last_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    online_sold INT NOT NULL DEFAULT 0,
    offline_sold INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY ix_inventory_menu_id (menu_id),
    CONSTRAINT fk_inventory_menu FOREIGN KEY (menu_id) REFERENCES menu (id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE combos (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    item1_id INT UNSIGNED NOT NULL,
    item2_id INT UNSIGNED NOT NULL,
    combo_price DECIMAL(10,2) NOT NULL,
    is_preferred TINYINT(1) NOT NULL DEFAULT 0,
    available TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    KEY ix_combos_item1_id (item1_id),
    KEY ix_combos_item2_id (item2_id),
    CONSTRAINT fk_combos_item1 FOREIGN KEY (item1_id) REFERENCES menu (id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_combos_item2 FOREIGN KEY (item2_id) REFERENCES menu (id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE restaurant_tables (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    table_number INT NOT NULL,
    capacity INT NOT NULL DEFAULT 4,
    qr_code VARCHAR(255) NULL,
    status ENUM('Available', 'Occupied', 'Reserved') NOT NULL DEFAULT 'Available',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    current_order_id INT UNSIGNED NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_restaurant_tables_table_number (table_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
