CREATE TABLE schema_migrations (
    version VARCHAR(16) NOT NULL,
    name VARCHAR(255) NOT NULL,
    checksum CHAR(64) NOT NULL,
    schema_fingerprint CHAR(64) NOT NULL,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
