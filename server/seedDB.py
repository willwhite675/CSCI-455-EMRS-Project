import mariadb
import os
from Crypto.Protocol.KDF import bcrypt, bcrypt_check
from Crypto.Random import get_random_bytes
from dotenv import load_dotenv

BCRYPT_COST = 12

# Load environment variables
load_dotenv()

def hash_password(password: str) -> bytes:
    password_bytes = password.encode("utf-8")
    salt = get_random_bytes(16)
    return bcrypt(password_bytes, BCRYPT_COST, salt)

def create_default_admin():
    try:
        # Connect to MariaDB
        conn = mariadb.connect(
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=int(os.getenv("DB_PORT", 3306)),
            database=os.getenv("DB_NAME")
        )
        cursor = conn.cursor()

        # Hash the password
        password = "dave"
        hashed_password = hash_password(password)

        # Insert the admin into the new 'User' table
        cursor.execute(
            """
            INSERT IGNORE INTO useraccount (username, password, email, role)
            VALUES (?, ?, ?, ?)
            """,
            ('dave', hashed_password, 'dave@dave.com', 'Admin')
        )

        cursor.execute(
            """
            SELECT accountID FROM useraccount WHERE username = 'dave'
            """
        )
        accountID = cursor.fetchone()[0]

        cursor.execute(
            """
            INSERT IGNORE INTO patient (accountID, firstName, lastName, phoneNumber, DOB, gender, insuranceDetails)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (accountID, 'dave', 'dave', '7', '0000-01-01', 'Male', 'dave')
        )

        conn.commit()
        print("Default admin created successfully!")

    except mariadb.Error as e:
        print(f"Error connecting to MariaDB: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    create_default_admin()