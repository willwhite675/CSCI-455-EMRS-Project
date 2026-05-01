import mariadb
import os
from Crypto.Protocol.KDF import bcrypt
from Crypto.Random import get_random_bytes
from dotenv import load_dotenv
from datetime import datetime, timedelta

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

        # Department and Provider
        cursor.execute("INSERT IGNORE INTO Department (departmentName) VALUES ('System Administration')")
        cursor.execute("SELECT departmentID FROM Department WHERE departmentName = 'System Administration'")
        dept_id = cursor.fetchone()[0]

        provider_pass = hash_password("Dave")
        cursor.execute(
            "INSERT IGNORE INTO UserAccount (username, password, email, role) VALUES (?, ?, ?, ?)",
            ('Dave', provider_pass, 'dave@dave.com', 'Dave')
        )
        cursor.execute("SELECT accountID FROM UserAccount WHERE username = 'Dave'")
        prov_account_id = cursor.fetchone()[0]

        cursor.execute(
            """
            INSERT IGNORE INTO HealthcareProvider (accountID, departmentID, firstName, lastName, providerType, specialty)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (prov_account_id, dept_id, 'Dave', 'Dave', 'Doctor', 'Dave')
        )
        cursor.execute("SELECT providerID FROM HealthcareProvider WHERE accountID = ?", (prov_account_id,))
        provider_id = cursor.fetchone()[0]

        # Admin and Patient
        password = "Dave"
        hashed_password = hash_password(password)

        cursor.execute(
            "INSERT IGNORE INTO UserAccount (username, password, email, role) VALUES (?, ?, ?, ?)",
            ('Dave', hashed_password, 'dave@dave.com', 'Admin')
        )

        cursor.execute("SELECT accountID FROM UserAccount WHERE username = 'Dave'")
        accountID = cursor.fetchone()[0]

        cursor.execute(
            """
            INSERT IGNORE INTO Patient (accountID, firstName, lastName, phoneNumber, DOB, gender, insuranceDetails)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (accountID, 'Dave', 'Admin', '67', '0000-01-01', 'Male', 'Dave')
        )

        cursor.execute("SELECT patientID FROM Patient WHERE accountID = ?", (accountID,))
        patient_id = cursor.fetchone()[0]

        # Medical History & Allergies
        history_data = [(patient_id, 'Ligma'), (patient_id, 'Imposter Syndrome')]
        cursor.executemany("INSERT INTO PatientHistory (patientID, diagnosis) VALUES (?, ?)", history_data)

        allergy_data = [(patient_id, 'Cat girls'), (patient_id, 'Women')]
        cursor.executemany("INSERT INTO PatientAllergy (patientID, allergen) VALUES (?, ?)", allergy_data)

        # Appointments & Visits
        visit_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        cursor.execute(
            """
            INSERT INTO Appointment (patientID, providerID, appointmentTimestamp, reason, status)
            VALUES (?, ?, ?, ?, ?)
            """,
            (patient_id, provider_id, visit_time, 'Yearly Aura Check', 'Completed')
        )
        appointment_id = cursor.lastrowid

        cursor.execute(
            """
            INSERT INTO Visit (patientID, providerID, appointmentID, visitTimestamp, purpose, walkIn)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (patient_id, provider_id, appointment_id, visit_time, 'Yearly Aura Check', False)
        )
        visit_id = cursor.lastrowid

        # Billing & Labs
        billing_data = [
            (0.00, 'Paid', patient_id, visit_id),
            (1000000.00, 'Pending', patient_id, visit_id) # Second bill for "Premium Aura"
        ]
        cursor.executemany("INSERT INTO Billing (amount, status, patientID, visitID) VALUES (?, ?, ?, ?)", billing_data)

        lab_data = [
            (patient_id, visit_id, 'Aura Generation', visit_time, '100%', '99-100%', 'Completed', 'Patient exhibits full aura.', provider_id),
            (patient_id, visit_id, 'Alpha Status', visit_time, 'Alpha', 'Beta-Alpha', 'Completed', 'Patient is an Alpha Wolf.', provider_id)
        ]
        cursor.executemany(
            """
            INSERT INTO LabResult (patientID, visitID, testName, testDate, resultValue, referenceRange, status, notes, orderedBy)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            lab_data
        )

        # Future Appointment
        future_time = (datetime.now() + timedelta(days=14)).strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute(
            """
            INSERT INTO Appointment (patientID, providerID, appointmentTimestamp, reason, status)
            VALUES (?, ?, ?, ?, ?)
            """,
            (patient_id, provider_id, future_time, 'Bi-Weekly Aura Farm', 'Scheduled')
        )

        conn.commit()
        print("Default admin 'Dave' and complete clinical history seeded successfully!")

    except mariadb.Error as e:
        print(f"Error connecting to MariaDB: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    create_default_admin()