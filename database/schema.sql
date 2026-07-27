-- Database: anaadi
-- Run this file to set up the database schema from scratch

-- ---------------------------------------------------------------------------
-- Table: users
-- Stores registered user accounts. Passwords are stored as bcrypt hashes.
-- The role field distinguishes regular users from admins.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    email       VARCHAR(255)    NOT NULL,
    password    VARCHAR(255)    NOT NULL,
    role        ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Table: design_images
-- The reference design library. Each row represents one jewellery image that
-- has been imported, stored on disk, and indexed as a vector embedding.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS design_images (
    id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    original_filename   VARCHAR(255)    NOT NULL,
    stored_filename     VARCHAR(255)    NOT NULL,
    file_path           VARCHAR(512)    NOT NULL,
    file_size           BIGINT UNSIGNED NOT NULL DEFAULT 0,
    mime_type           VARCHAR(100)             DEFAULT NULL,
    image_width         INT UNSIGNED             DEFAULT NULL,
    image_height        INT UNSIGNED             DEFAULT NULL,
    uploaded_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_design_images_stored_filename (stored_filename)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Table: search_history
-- One row per image search performed by a user. Records the query image
-- details and the total number of results returned.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS search_history (
    id                          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    user_id                     INT UNSIGNED    NOT NULL,
    query_image_original_name   VARCHAR(255)             DEFAULT NULL,
    query_image_stored_name     VARCHAR(255)             DEFAULT NULL,
    query_image_path            VARCHAR(512)             DEFAULT NULL,
    total_results               INT UNSIGNED    NOT NULL DEFAULT 0,
    created_at                  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_search_history_user_id (user_id),
    CONSTRAINT fk_search_history_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Table: search_history_results
-- The individual ranked results for each search. Each row links one search
-- to one design image, with its rank position and similarity score.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS search_history_results (
    id                  INT UNSIGNED        NOT NULL AUTO_INCREMENT,
    search_history_id   INT UNSIGNED        NOT NULL,
    design_image_id     INT UNSIGNED        NOT NULL,
    result_rank         SMALLINT UNSIGNED   NOT NULL DEFAULT 1,
    similarity_score    DECIMAL(6, 4)                DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_shr_search_history_id (search_history_id),
    KEY idx_shr_design_image_id (design_image_id),
    CONSTRAINT fk_shr_search_history
        FOREIGN KEY (search_history_id) REFERENCES search_history (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_shr_design_image
        FOREIGN KEY (design_image_id) REFERENCES design_images (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Table: saved_searches
-- Bookmarks created by users to track a specific (query image, result image)
-- pair from a past search. Supports optional dealer name and notes fields.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_searches (
    id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    user_id             INT UNSIGNED    NOT NULL,
    search_history_id   INT UNSIGNED    NOT NULL,
    design_image_id     INT UNSIGNED    NOT NULL,
    name                VARCHAR(255)             DEFAULT NULL,
    dealer_name         VARCHAR(255)             DEFAULT NULL,
    notes               TEXT                     DEFAULT NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_saved_searches_user_id (user_id),
    CONSTRAINT fk_saved_searches_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_saved_searches_search_history
        FOREIGN KEY (search_history_id) REFERENCES search_history (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_saved_searches_design_image
        FOREIGN KEY (design_image_id) REFERENCES design_images (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
