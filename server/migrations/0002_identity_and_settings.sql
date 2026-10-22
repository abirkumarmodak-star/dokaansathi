CREATE TABLE users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NULL,
    phone VARCHAR(15) NULL,
    password VARCHAR(255) NULL,
    role ENUM('Owner', 'Staff', 'Customer') NULL,
    language ENUM('Bengali', 'English', 'Hindi') NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE staff (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Manager', 'Counter', 'Kitchen', 'Waiter', 'DeliveryBoy') NOT NULL,
    status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    work_start_time TIME NULL,
    work_end_time TIME NULL,
    online_status ENUM('Online', 'Offline') NOT NULL DEFAULT 'Offline',
    on_leave TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_staff_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE customers (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NULL,
    orderType VARCHAR(50) NULL,
    tableNumber INT NULL,
    phone VARCHAR(15) NULL,
    delivery_address VARCHAR(500) NULL,
    latitude DECIMAL(10,7) NULL,
    longitude DECIMAL(10,7) NULL,
    pending_cancellation_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (id),
    KEY ix_customers_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE shop_settings (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    shop_name VARCHAR(100) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NULL,
    upi_id VARCHAR(100) NULL,
    language VARCHAR(20) NOT NULL DEFAULT 'English',
    latitude DECIMAL(10,7) NULL,
    longitude DECIMAL(10,7) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE shop_status (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    shop_name VARCHAR(100) NULL,
    status ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'CLOSED',
    opening_time DATETIME NULL,
    closing_time DATETIME NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO shop_status (id, status) VALUES (1, 'CLOSED');

CREATE TABLE whatsapp_settings (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    emergency_mode TINYINT(1) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO whatsapp_settings (id, emergency_mode) VALUES (1, 0);
