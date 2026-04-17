import mariadb
import bcrypt
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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
        password = b"dave"
        hashed_password = bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')

        # Insert the admin into the new 'User' table
        # Using INSERT IGNORE so it doesn't crash if 'dave' or the email already exists
        cursor.execute(
            """
            INSERT IGNORE INTO User (username, password, email, role)
            VALUES (?, ?, ?, ?)
            """,
            ('dave', hashed_password, 'admin@emrs.local', 'Admin')
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