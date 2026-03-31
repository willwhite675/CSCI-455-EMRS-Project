from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mariadb
import os
from dotenv import load_dotenv
from security import hash_password, verify_password

app = FastAPI()
load_dotenv()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8000", "http://localhost:8000", "https://willwhite675.github.io/CSCI-455-EMRS-Project"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Login(BaseModel):
    username: str
    password: str

def get_connection():
    return mariadb.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        port=int(os.getenv("DB_PORT")),
    )

@app.post("/login")
async def login(data: Login):
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT authCredentials FROM user WHERE id = ?",
            (data.username.strip(),)
        )
        row = cur.fetchone()

        if row and verify_password(data.password.strip(), row[0]):
            return {"success": True, "message": "Login successful"}
        else:
            return {"success": False, "message": "Invalid credentials"}

    except Exception as e:
        return {"success": False, "message": f"Server error: {str(e)}"}

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.post("/create-account")
async def create_account(data: Login):
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        hashed_password = hash_password(data.password.strip())

        cur.execute(
            "INSERT INTO User (ID, authCredentials, twoFactorEnabled, userType) VALUES (?, ?, ?, ?)",
            (data.username.strip(), hashed_password, False, "Patient")
        )
        conn.commit()

        if cur.rowcount > 0:
            return {"success": True, "message": "Account created successfully"}
        else:
            return {"success": False, "message": "Failed to create account"}

    except Exception as e:
        return {"success": False, "message": f"Server error: {str(e)}"}

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()