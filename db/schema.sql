CREATE DATABASE IF NOT EXISTS EMRS_database;
USE EMRS_database;

# ── Department ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Department
(
    departmentID   INT PRIMARY KEY AUTO_INCREMENT,
    departmentName VARCHAR(100) NOT NULL UNIQUE
);

# ── Core Tables ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS User
(
    accountID         INT PRIMARY KEY AUTO_INCREMENT,
    username         VARCHAR(50) NOT NULL UNIQUE,
    password         VARCHAR(255) NOT NULL,
    email            VARCHAR(100) NOT NULL UNIQUE,
    twoFactorEnabled BOOLEAN      NOT NULL DEFAULT FALSE,
    role ENUM('Patient', 'Provider', 'Admin') NOT NULL DEFAULT 'Patient',
    disabled        BOOLEAN       NOT NULL DEFAULT FALSE
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
    lastVisit        DATE,
    FOREIGN KEY (accountID) REFERENCES User (accountID)
        ON DELETE CASCADE
);;

CREATE TABLE IF NOT EXISTS HealthcareProvider
(
    providerID INT PRIMARY KEY AUTO_INCREMENT,
    accountID INT UNIQUE NOT NULL,
    departmentID INT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    FOREIGN KEY (accountID) REFERENCES User(accountID) ON DELETE CASCADE,
    FOREIGN KEY (departmentID) REFERENCES Department(departmentID) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Doctor
(
    doctorID               INT PRIMARY KEY,
    specialization VARCHAR(100) NOT NULL DEFAULT 'General Practice',
    FOREIGN KEY (doctorID) REFERENCES HealthcareProvider (providerID)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Nurse
(
    nurseID INT PRIMARY KEY,
    FOREIGN KEY (nurseID) REFERENCES HealthcareProvider (providerID)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS MedicalRecord
(
    recordID    INT PRIMARY KEY AUTO_INCREMENT,
    medicalHistory TEXT        NOT NULL,
    allergyProfile TEXT        NOT NULL,
    insuranceDetails VARCHAR(255) NOT NULL,
    isLocked    BOOLEAN DEFAULT FALSE NOT NULL,
    patientID   INT NOT NULL,
    FOREIGN KEY (patientID) REFERENCES Patient (patientID)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Visit
(
    visitID  INT PRIMARY KEY AUTO_INCREMENT,
    Purpose  VARCHAR(255) NOT NULL,
    Time     DATETIME  NOT NULL,
    Date     DATE         NOT NULL,
    WalkIn   BOOLEAN DEFAULT FALSE NOT NULL,
    recordID INT          NOT NULL,
    FOREIGN KEY (recordID) REFERENCES MedicalRecord (recordID)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Billing
(
    billingID INT PRIMARY KEY AUTO_INCREMENT,
    amount    DOUBLE      NOT NULL,
    status    VARCHAR(50) NOT NULL DEFAULT 'Pending',
    patientID INT NOT NULL,
    FOREIGN KEY (patientID) REFERENCES Patient (patientID)
        ON DELETE CASCADE
);

# ── Associative Tables ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Visit_Doctor
(
    visitID  INT,
    doctorID INT,
    PRIMARY KEY (visitID, doctorID),
    FOREIGN KEY (visitID) REFERENCES Visit (visitID)
        ON DELETE CASCADE,
    FOREIGN KEY (doctorID) REFERENCES Doctor (doctorID)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Visit_Nurse
(
    visitID INT,
    nurseID INT,
    PRIMARY KEY (visitID, nurseID),
    FOREIGN KEY (visitID) REFERENCES Visit (visitID)
        ON DELETE CASCADE,
    FOREIGN KEY (nurseID) REFERENCES Nurse (nurseID)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Record_Log
(
    logID INT PRIMARY KEY AUTO_INCREMENT,
    providerID INT,
    recordID   INT,
    accessTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (providerID)
        REFERENCES HealthcareProvider (providerID)
        ON DELETE CASCADE,
    FOREIGN KEY (recordID)
        REFERENCES MedicalRecord (recordID)
        ON DELETE CASCADE
);
