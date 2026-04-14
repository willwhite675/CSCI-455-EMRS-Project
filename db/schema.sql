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
    ID               VARCHAR(50) PRIMARY KEY,
    authCredentials  VARCHAR(255) NOT NULL,
    firstName        VARCHAR(50)  NOT NULL,
    lastName         VARCHAR(50)  NOT NULL,
    phoneNumber      VARCHAR(20)  NOT NULL,
    age              INT          NOT NULL,
    gender           VARCHAR(10)  NOT NULL,
    email            VARCHAR(100) NOT NULL UNIQUE,
    twoFactorEnabled BOOLEAN      Not NULL DEFAULT FALSE,
    userType         VARCHAR(20)  NOT NULL DEFAULT 'Patient',
        CHECK (userType IN ('Patient', 'Provider', 'Admin')),
    disabled        BOOLEAN       NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS Patient
(
    ID               VARCHAR(50) PRIMARY KEY,
    medicalHistory   TEXT,
    allergyProfile   TEXT,
    insuranceDetails VARCHAR(255),
    lastVisit        DATE,
    FOREIGN KEY (ID) REFERENCES User (ID)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS HealthcareProvider
(
    ID           VARCHAR(50) PRIMARY KEY,
    providerID   VARCHAR(50) NOT NULL UNIQUE,
    departmentID INT,
    FOREIGN KEY (ID) REFERENCES User (ID)
        ON DELETE CASCADE,
    FOREIGN KEY (departmentID) REFERENCES Department (departmentID)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Doctor
(
    ID             VARCHAR(50) PRIMARY KEY,
    specialization VARCHAR(100) NOT NULL DEFAULT 'General Practice',
    FOREIGN KEY (ID) REFERENCES HealthcareProvider (ID)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Nurse
(
    ID VARCHAR(50) PRIMARY KEY,
    FOREIGN KEY (ID) REFERENCES HealthcareProvider (ID)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Administrator
(
    ID VARCHAR(50) PRIMARY KEY,
    FOREIGN KEY (ID) REFERENCES HealthcareProvider (ID)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS MedicalRecord
(
    recordID    INT PRIMARY KEY AUTO_INCREMENT,
    encodedData TEXT        NOT NULL,
    isLocked    BOOLEAN DEFAULT FALSE NOT NULL,
    patientID   VARCHAR(50) NOT NULL,
    FOREIGN KEY (patientID) REFERENCES Patient (ID)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Visit
(
    visitID  INT PRIMARY KEY AUTO_INCREMENT,
    Purpose  VARCHAR(255) NOT NULL,
    Time     VARCHAR(50)  NOT NULL,
    Date     DATE         NOT NULL,
    WalkIn   BOOLEAN DEFAULT FALSE NOT NULL,
    recordID INT          NOT NULL,
    FOREIGN KEY (recordID) REFERENCES MedicalRecord (recordID)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Billing
(
    billingID VARCHAR(50) PRIMARY KEY,
    amount    DOUBLE      NOT NULL,
    status    VARCHAR(50) NOT NULL DEFAULT 'Pending',
    patientID VARCHAR(50) NOT NULL,
    FOREIGN KEY (patientID) REFERENCES Patient (ID)
        ON DELETE CASCADE
);

# ── Associative Tables ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Visit_Doctor
(
    visitID  INT,
    doctorID VARCHAR(50),
    PRIMARY KEY (visitID, doctorID),
    FOREIGN KEY (visitID) REFERENCES Visit (visitID)
        ON DELETE CASCADE,
    FOREIGN KEY (doctorID) REFERENCES Doctor (ID)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Visit_Nurse
(
    visitID INT,
    nurseID VARCHAR(50),
    PRIMARY KEY (visitID, nurseID),
    FOREIGN KEY (visitID) REFERENCES Visit (visitID)
        ON DELETE CASCADE,
    FOREIGN KEY (nurseID) REFERENCES Nurse (ID)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Visit_Administrator
(
    visitID INT,
    adminID VARCHAR(50),
    PRIMARY KEY (visitID, adminID),
    FOREIGN KEY (visitID) REFERENCES Visit (visitID)
        ON DELETE CASCADE,
    FOREIGN KEY (adminID) REFERENCES Administrator (ID)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Provider_MedicalRecord
(
    providerID VARCHAR(50),
    recordID   INT,
    accessTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (providerID, recordID),
    FOREIGN KEY (providerID)
        REFERENCES HealthcareProvider (ID)
        ON DELETE CASCADE,
    FOREIGN KEY (recordID)
        REFERENCES MedicalRecord (recordID)
        ON DELETE CASCADE
);
