from typing import Annotated, List
from datetime import date
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mariadb
import os
from dotenv import load_dotenv
from security import hash_password, verify_password
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

app = FastAPI()
load_dotenv()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8000", "http://localhost:8000", "https://willwhite675.github.io"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_current_active_user(
        current_user: Annotated[User, Depends(get_current_user)],
):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_active_user)):
        # Check if the user's role is in the allowed list
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )

class Login(BaseModel):
    username: str
    password: str

class User(BaseModel):
    username: str
    email: str | None = None
    disabled: bool | None = None
    role: str | None = None

class UserInDB(User):
    hashed_password: str

class CreateAccount(BaseModel):
    username: str
    password: str
    firstName: str
    lastName: str
    phoneNumber: str
    DOB: date
    gender: str
    email: str
    role: str
    insuranceDetails: str

class AddProvider(BaseModel):
    accountID: int
    providerID: int
    departmentID: int
    firstName: str
    lastName: str
    providerType: str
    specialty: str

class AddPatient(BaseModel):
    username: str

class RemoveProvider(BaseModel):
    username: str

def get_connection():
    return mariadb.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        port=int(os.getenv("DB_PORT")),
    )

def get_user_from_db(username: str):
    # Fetch user from database
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT username, password, email, role FROM useraccount WHERE username = ?",
            (username.strip(),)
        )
        row = cur.fetchone()

        if row:
            return UserInDB(
                username=row[0],
                hashed_password=row[1],
                email=row[2],
                role=row[3],
                disabled=False
            )
        return None
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

def decode_token(token):
    # This doesn't provide any security at all, but for this project we don't need
    # full JWT validation
    user = get_user_from_db(token)
    return user

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    user = decode_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@app.get("/get-providers", dependencies=[Depends(RoleChecker(["Admin"]))])
async def get_providers():
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
                    SELECT
                        hp.providerID,
                        hp.firstName,
                        hp.lastName,
                        u.email,
                        hp.accountID,
                        hp.providerType,
                        hp.specialty,
                        hp.departmentID,
                        d.departmentName
                    FROM healthcareprovider hp
                        LEFT JOIN useraccount u ON hp.accountID = u.accountID
                        LEFT JOIN department d ON hp.departmentID = d.departmentID
                    """)
        providers = cur.fetchall()
        provider_list = [
            {
                "providerID": row[0],
                "firstName": row[1],
                "lastName": row[2],
                "email": row[3],
                "accountID": row[4],
                "providerType": row[5],
                "specialty": row[6],
                "departmentID": row[7],
                "departmentName": row[8]
            }
            for row in providers
        ]

        return {"providers": sorted(provider_list, key=lambda x: x["firstName"])}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Server error: {str(e)}"
        )

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.get("/get-patient-allergies", dependencies=[Depends(RoleChecker(["Provider", "Admin"]))])
async def get_patient_allergies(patientID: str):
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
                    SELECT
                        allergen
                    FROM patientallergy
                    WHERE patientID = %s
                    """, (patientID,))

        allergies = cur.fetchall()
        return {"success": True, "allergies": allergies}

    except Exception as e:
        return {"success": False, "message": f"Server error: {str(e)}"}

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.get("/get-patients", dependencies=[Depends(RoleChecker(["Provider", "Admin"]))])
async def get_patients():
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
                    SELECT
                        p.firstName,
                        p.lastName,
                        p.gender,
                        p.DOB,
                        p.phoneNumber,
                        u.email,
                        p.insuranceDetails
                    FROM patient p
                             LEFT JOIN useraccount u ON p.accountID = u.accountID
                    """)
        patients = cur.fetchall()
        patient_list = [
            {
                "firstName": row[0],
                "lastName": row[1],
                "gender": row[2],
                "DOB": row[3],
                "phoneNumber": row[4],
                "email": row[5],
                "insuranceDetails": row[6]
            }
            for row in patients]

        return {"patients": sorted(patient_list, key=lambda x: x["firstName"])}

    except Exception as e:
        return {"success": False, "message": f"Server error: {str(e)}"}

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.get("/get-departments", dependencies=[Depends(RoleChecker(["Admin"]))])
async def get_departments():
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("SELECT * FROM department")
        departments = cur.fetchall()
        department_list = [{"departmentID": row[0], "departmentName": row[1]} for row in departments]

        return {"departments": sorted(department_list, key=lambda x: x["departmentName"])}
    except Exception as e:
        return {"success": False, "message": f"Server error: {str(e)}"}
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.get("/users/me")
async def read_users_me(
        current_user: Annotated[User, Depends(get_current_active_user)],
):
    # Get current user
    return current_user

@app.get("/users/{username}")
async def get_record(username: str):
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT username, email, role FROM useraccount WHERE username = ?",
            (username.strip(),)
        )
        row = cur.fetchone()

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return {"username": row[0], "email": row[1], "role": row[2]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Server error: {str(e)}"
        )

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.post("/token")
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    # OAuth2 token login endpoint
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT password, role FROM useraccount WHERE username = ?",
            (form_data.username.strip(),)
        )
        row = cur.fetchone()

        if not row:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not verify_password(form_data.password.strip(), row[0]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check if user is an administrator
        is_admin = row[1] == "Admin"

        # For now, using username as token
        return {
            "access_token": form_data.username.strip(),
            "token_type": "bearer",
            "user_type": row[1],
            "is_admin": is_admin
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Server error: {str(e)}"
        )
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.post("/create-account")
async def create_account(data: CreateAccount):
    conn = None
    cur = None


    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)

        hashed_password = hash_password(data.password.strip())

        cur.execute(
            "SELECT username FROM useraccount WHERE username = ?",
            (data.username.strip(),)
        )
        user_row = cur.fetchone()
        if user_row is not None:
            raise HTTPException(status_code=400, detail="User already exists")

        cur.execute(
            "INSERT INTO useraccount (username, password, email, twoFactorEnabled, role) VALUES (?, ?, ?, ?, ?)",
            (data.username.strip(), hashed_password, data.email.strip(), False, data.role.strip())
        )

        cur.execute("SELECT LAST_INSERT_ID() AS accountID FROM useraccount")
        accountIDRow = cur.fetchone()
        if accountIDRow is None:
            raise HTTPException(status_code=500, detail="Failed to retrieve account ID")
        accountID = accountIDRow['accountID']

        cur.execute(
            """
            INSERT INTO patient (
                accountID, firstName, lastName, DOB, phoneNumber, gender, insuranceDetails
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (accountID, data.firstName.strip(), data.lastName.strip(), data.DOB, data.phoneNumber.strip(), data.gender.strip(), data.insuranceDetails.strip())
        )
        conn.commit()

        if cur.rowcount > 0:
            return {"success": True, "message": "Account created successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Server error: {str(e)}"
        )

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.post("/add-provider", dependencies=[Depends(RoleChecker(["Admin"]))])
async def add_provider(data: AddProvider):
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)

        if data.accountID == "" or data.departmentID == "":
            raise HTTPException(status_code=400, detail="Username, Provider ID, and department ID cannot be empty")

        cur.execute("SELECT departmentID FROM department")

        department_rows = cur.fetchall()
        department_ids = [row['departmentID'] for row in department_rows]

        if data.departmentID not in department_ids:
            raise HTTPException(status_code=400, detail="Invalid department ID")

        cur.execute(
            "SELECT accountID FROM healthcareprovider WHERE ID = ?",
            data.accountID
        )
        provider_row = cur.fetchone()
        if provider_row is not None:
            raise HTTPException(status_code=400, detail="Employee already exists")

        cur.execute(
            "UPDATE useraccount SET userType = 'Provider' WHERE ID = ?",
            data.accountID
        )

        cur.execute(
            "SELECT firstName, lastName FROM patient WHERE accountID = ?",
            data.accountID
        )
        patient_row = cur.fetchone()
        if patient_row is None:
            raise HTTPException(status_code=400, detail="Patient does not exist")
        firstName, lastName = patient_row

        cur.execute(
            "INSERT INTO healthcareprovider (accountID, departmentID, departmentID, firstName, lastName, providerType, specialty) VALUES (?, ?, ?)",
            (data.accountID, data.providerID, data.departmentID, firstName, lastName, data.providerType, data.specialty)
        )

        conn.commit()

        if cur.rowcount > 0:
            return {"success": True, "message": f"Provider {firstName} {lastName} added successfully"}
        else:
            return {"success": False, "message": "Failed to add provider"}

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.post("/add-patient", dependencies=[Depends(RoleChecker(["Provider", "Admin"]))])
async def add_patient(data: AddPatient):
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "INSERT INTO patient (ID) VALUES (?)",
            (data.username.strip())
        )
        cur.execute(
            "UPDATE user SET userType = 'Patient' WHERE ID = ?",
        )

        conn.commit()

        if cur.rowcount > 0:
            return {"success": True, "message": "Patient added successfully"}
        else:
            return {"success": False, "message": "Failed to add patient"}

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.post("/remove-provider", dependencies=[Depends(RoleChecker(["Admin"]))])
async def remove_provider(data: RemoveProvider):
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT ID FROM healthcareprovider WHERE ID = ?",
            (data.username.strip(),)
        )
        provider_row = cur.fetchone()
        if provider_row is None:
            raise HTTPException(status_code=404, detail="Provider not found")

        cur.execute(
            "UPDATE user SET disabled = True WHERE ID = ?",
            (data.username.strip(),)
        )
        cur.execute(
            "DELETE FROM healthcareprovider WHERE ID = ?",
            (data.username.strip(),)
        )
        cur.execute(
            "UPDATE user SET userType = 'Patient' WHERE ID = ?",
            (data.username.strip(),)
        )

        conn.commit()

        return {"success": True, "message": "Provider removed successfully"}

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()