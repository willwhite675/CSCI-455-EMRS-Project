CREATE DATABASE IF NOT EXISTS emrs_database;
USE emrs_database;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
    );
INSERT IGNORE INTO users (username, password) VALUES ('Bob', 'Donuts');
INSERT IGNORE INTO users (username, password) VALUES ('Jesse', 'McCree');