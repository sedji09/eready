-- Create Database
CREATE DATABASE IF NOT EXISTS eready_db;
USE eready_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Food & Water Inventory
CREATE TABLE IF NOT EXISTS food_water_inventory (
    batch_no INT PRIMARY KEY AUTO_INCREMENT,
    item_name VARCHAR(100) NOT NULL,
    category ENUM('Food', 'Water') NOT NULL,
    quantity INT NOT NULL,
    manufactured_date DATE DEFAULT NULL,
    expiration_date DATE NOT NULL,
    location VARCHAR(100) NOT NULL,
    person_in_charge VARCHAR(100) DEFAULT NULL,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expiration (expiration_date),
    INDEX idx_category (category)
);

-- Medicine & First Aid Inventory
CREATE TABLE IF NOT EXISTS medicine_inventory (
    batch_no INT PRIMARY KEY AUTO_INCREMENT,
    item_name VARCHAR(100) NOT NULL,
    category ENUM('Medicine', 'First Aid') NOT NULL,
    quantity INT NOT NULL,
    dosage VARCHAR(100),
    manufactured_date DATE,
    expiration_date DATE,
    location VARCHAR(100) NOT NULL,
    person_in_charge VARCHAR(100) DEFAULT NULL,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expiration (expiration_date),
    INDEX idx_category (category)
);

-- Hygiene & Sanitation Inventory
CREATE TABLE IF NOT EXISTS hygiene_sanitation_inventory (
    batch_no INT PRIMARY KEY AUTO_INCREMENT,
    item_name VARCHAR(100) NOT NULL,
    category ENUM('Hygiene', 'Sanitation') NOT NULL,
    quantity INT NOT NULL,
    unit_type VARCHAR(100),
    manufactured_date DATE,
    expiration_date DATE,
    location VARCHAR(100) NOT NULL,
    person_in_charge VARCHAR(100),
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expiration (expiration_date),
    INDEX idx_category (category)
);

-- Clothes & Beddings Inventory
CREATE TABLE IF NOT EXISTS clothes_beddings_inventory (
    batch_no INT PRIMARY KEY AUTO_INCREMENT,
    item_name VARCHAR(100) NOT NULL,
    category ENUM('Clothes', 'Bedding') NOT NULL,
    quantity INT NOT NULL,
    condition_status ENUM('Good', 'For Repair', 'Damaged') NOT NULL,
    date_acquired DATE,
    location VARCHAR(100) NOT NULL,
    person_in_charge VARCHAR(100),
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_condition (condition_status)
);

-- Tools & Lights Inventory
CREATE TABLE IF NOT EXISTS tools_lights_inventory (
    batch_no INT PRIMARY KEY AUTO_INCREMENT,
    item_name VARCHAR(100) NOT NULL,
    category ENUM('Tool', 'Light') NOT NULL,
    quantity INT NOT NULL,
    condition_status ENUM('Good', 'For Repair', 'Damaged') NOT NULL,
    date_acquired DATE,
    location VARCHAR(100) NOT NULL,
    person_in_charge VARCHAR(100),
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_condition (condition_status)
);

-- Distribution History Table
-- Tracks item distributions with recipient and distributor details
CREATE TABLE IF NOT EXISTS distribution_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category ENUM('food_water','medicine','hygiene_sanitation','clothes_beddings','tools_lights') NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    batch_no INT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    recipient VARCHAR(100) NULL,         -- Name of person/organization who received
    contact VARCHAR(50) NULL,            -- Recipient contact number or info
    distributed_by INT NULL,             -- FK to users.id (who distributed)
    notes VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_table_batch (table_name, batch_no), -- speeds up joins to source table
    CONSTRAINT fk_distribution_user FOREIGN KEY (distributed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- VIEWS: Auto-calculate days_until_expiry
CREATE OR REPLACE VIEW vw_food_water_inventory AS
SELECT *,
       DATEDIFF(expiration_date, CURDATE()) AS days_until_expiry
FROM food_water_inventory;

CREATE OR REPLACE VIEW vw_medicine_inventory AS
SELECT *,
       DATEDIFF(expiration_date, CURDATE()) AS days_until_expiry
FROM medicine_inventory;


CREATE OR REPLACE VIEW vw_hygiene_sanitation_inventory AS
SELECT *,
       DATEDIFF(expiration_date, CURDATE()) AS days_until_expiry
FROM hygiene_sanitation_inventory;

CREATE OR REPLACE VIEW vw_clothes_beddings_inventory AS
SELECT *
FROM clothes_beddings_inventory;

CREATE OR REPLACE VIEW vw_tools_lights_inventory AS
SELECT *
FROM tools_lights_inventory;