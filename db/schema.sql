CREATE DATABASE IF NOT EXISTS EMRS_database;
USE EMRS_database;

CREATE TABLE IF NOT EXISTS Department
(
    departmentID   INT PRIMARY KEY AUTO_INCREMENT,
    departmentName VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS UserAccount
(
    accountID        INT PRIMARY KEY AUTO_INCREMENT,
    username         VARCHAR(50)  NOT NULL UNIQUE,
    password         VARCHAR(255) NOT NULL,
    email            VARCHAR(100) NOT NULL UNIQUE,
    twoFactorEnabled BOOLEAN      NOT NULL DEFAULT FALSE,
    role             ENUM('Patient', 'Provider', 'Admin') NOT NULL DEFAULT 'Patient',
    disabled         BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS Patient
(
    patientID        INT PRIMARY KEY AUTO_INCREMENT,
    accountID        INT NOT NULL UNIQUE,
    firstName        VARCHAR(100) NOT NULL,
    lastName         VARCHAR(100) NOT NULL,
    DOB              DATE NOT NULL,
    phoneNumber      VARCHAR(20) NOT NULL,
    gender           VARCHAR(10) NOT NULL,
    insuranceDetails VARCHAR(255),
    FOREIGN KEY (accountID) REFERENCES UserAccount (accountID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS HealthcareProvider
(
    providerID   INT PRIMARY KEY AUTO_INCREMENT,
    accountID    INT UNIQUE NOT NULL,
    departmentID INT,
    firstName    VARCHAR(100) NOT NULL,
    lastName     VARCHAR(100) NOT NULL,
    providerType ENUM('Doctor', 'Nurse') NOT NULL,
    specialty    VARCHAR(100) DEFAULT 'General Practice', -- Replaces the Doctor/Nurse sub-tables
    FOREIGN KEY (accountID) REFERENCES UserAccount(accountID) ON DELETE CASCADE,
    FOREIGN KEY (departmentID) REFERENCES Department(departmentID) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS PatientAllergy
(
    allergyID   INT PRIMARY KEY AUTO_INCREMENT,
    patientID   INT NOT NULL,
    allergen    VARCHAR(100) NOT NULL,
    FOREIGN KEY (patientID) REFERENCES Patient (patientID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS PatientHistory
(
    historyID   INT PRIMARY KEY AUTO_INCREMENT,
    patientID   INT NOT NULL,
    diagnosis   VARCHAR(255) NOT NULL,
    FOREIGN KEY (patientID) REFERENCES Patient (patientID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Visit
(
    visitID        INT PRIMARY KEY AUTO_INCREMENT,
    patientID      INT NOT NULL,
    providerID     INT NOT NULL,
    visitTimestamp DATETIME NOT NULL,
    purpose        VARCHAR(255) NOT NULL,
    walkIn         BOOLEAN DEFAULT FALSE NOT NULL,
    FOREIGN KEY (patientID) REFERENCES Patient (patientID) ON DELETE CASCADE,
    FOREIGN KEY (providerID) REFERENCES HealthcareProvider (providerID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Billing
(
    billingID INT PRIMARY KEY AUTO_INCREMENT,
    amount    DECIMAL(10,2) NOT NULL, -- Fixed precision for currency
    status    ENUM('Pending', 'Paid', 'Overdue') NOT NULL DEFAULT 'Pending',
    patientID INT NOT NULL,
    FOREIGN KEY (patientID) REFERENCES Patient (patientID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS SystemLog
(
    logID      INT PRIMARY KEY AUTO_INCREMENT,
    accountID  INT NOT NULL, -- Track by the base account, covers admins/providers/patients
    action     VARCHAR(255) NOT NULL,
    accessTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (accountID) REFERENCES UserAccount (accountID) ON DELETE CASCADE
);