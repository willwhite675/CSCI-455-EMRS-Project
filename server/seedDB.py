import mariadb
import os
from Crypto.Protocol.KDF import bcrypt
from Crypto.Random import get_random_bytes
from dotenv import load_dotenv
from datetime import datetime

BCRYPT_COST = 12

load_dotenv()

def hash_password(password: str) -> bytes:
    password_bytes = password.encode("utf-8")
    salt = get_random_bytes(16)
    return bcrypt(password_bytes, BCRYPT_COST, salt)

def create_default_admin():
    try:
        conn = mariadb.connect(
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=int(os.getenv("DB_PORT", 3306)),
            database=os.getenv("DB_NAME")
        )
        cursor = conn.cursor()

        cursor.execute("INSERT IGNORE INTO Department (departmentName) VALUES ('System Administration')")
        cursor.execute("SELECT departmentID FROM Department WHERE departmentName = 'System Administration'")
        dept_id = cursor.fetchone()[0]

        provider_pass = hash_password("internal_system_safe")
        cursor.execute(
            "INSERT IGNORE INTO UserAccount (username, password, email, role) VALUES (?, ?, ?, ?)",
            ('sys_provider', provider_pass, 'system@internal.local', 'Provider')
        )
        cursor.execute("SELECT accountID FROM UserAccount WHERE username = 'sys_provider'")
        prov_account_id = cursor.fetchone()[0]

        cursor.execute(
            """
            INSERT IGNORE INTO HealthcareProvider (accountID, departmentID, firstName, lastName, providerType, specialty)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (prov_account_id, dept_id, 'System', 'Diagnostic', 'Doctor', 'Automated Health Monitoring')
        )
        cursor.execute("SELECT providerID FROM HealthcareProvider WHERE accountID = ?", (prov_account_id,))
        provider_id = cursor.fetchone()[0]

        password = "dave"
        hashed_password = hash_password(password)

        cursor.execute(
            "INSERT IGNORE INTO UserAccount (username, password, email, role) VALUES (?, ?, ?, ?)",
            ('dave', hashed_password, 'dave@dave.com', 'Admin')
        )

        cursor.execute("SELECT accountID FROM UserAccount WHERE username = 'dave'")
        accountID = cursor.fetchone()[0]

        cursor.execute(
            """
            INSERT IGNORE INTO Patient (accountID, firstName, lastName, phoneNumber, DOB, gender, insuranceDetails)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (accountID, 'dave', 'dave', '67', '1970-01-01', 'Male', 'dave')
        )

        cursor.execute("SELECT patientID FROM Patient WHERE accountID = ?", (accountID,))
        patient_id = cursor.fetchone()[0]

        # Medical History
        cursor.execute(
            "INSERT INTO PatientHistory (patientID, diagnosis) VALUES (?, ?)",
            (patient_id, 'Ligma')
        )

        # Allergy
        cursor.execute(
            "INSERT INTO PatientAllergy (patientID, allergen) VALUES (?, ?)",
            (patient_id, 'Cat girls')
        )

        # Visit
        visit_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute(
            """
            INSERT INTO Visit (patientID, providerID, visitTimestamp, purpose, walkIn)
            VALUES (?, ?, ?, ?, ?)
            """,
            (patient_id, provider_id, visit_time, 'Yearly Aura Check', False)
        )
        visit_id = cursor.lastrowid

        # Billing
        cursor.execute(
            "INSERT INTO Billing (amount, status, patientID, visitID) VALUES (?, ?, ?, ?)",
            (0.00, 'Paid', patient_id, visit_id)
        )

        # Lab Results
        cursor.execute(
            """
            INSERT INTO LabResult (patientID, visitID, testName, testDate, resultValue, referenceRange, status, notes, orderedBy)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (patient_id, visit_id, 'Aura Generation', visit_time, '100%', '99-100%', 'Completed', 'User exhibits full aura.', provider_id)
        )

        conn.commit()
        print("Default admin 'dave' and associated medical records created successfully!")

    except mariadb.Error as e:
        print(f"Error connecting to MariaDB: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    create_default_admin()