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
    departmentID: int
    providerType: str
    specialty: str

class AddPatient(BaseModel):
    username: str

class RemoveProvider(BaseModel):
    accountID: int

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
            "SELECT username, password, email, role FROM useraccount WHERE username = %s",
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
                        p.accountID,
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
                "accountID": row[0],
                "firstName": row[1],
                "lastName": row[2],
                "gender": row[3],
                "DOB": row[4],
                "phoneNumber": row[5],
                "email": row[6],
                "insuranceDetails": row[7]
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
            "SELECT username, email, role FROM useraccount WHERE username = %s",
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

@app.get("/get-patient-by-id", dependencies=[Depends(RoleChecker(["Provider", "Admin"]))])
async def get_patient_by_id(accountID: str):
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT patientID, firstName, lastName, DOB, phoneNumber, gender, insuranceDetails FROM patient WHERE accountID = %s",
            (accountID.strip(),)
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        return {
            "patientID": row[0],
            "firstName": row[1],
            "lastName": row[2],
            "DOB": row[3],
            "phoneNumber": row[4],
            "gender": row[5],
            "insuranceDetails": row[6]
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

@app.get("/get-patient-medical-history", dependencies=[Depends(RoleChecker(["Provider", "Admin"]))])
async def get_patient_medical_history(patientID: str):
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT historyID, diagnosis FROM patienthistory WHERE patientID = %s",
            (patientID.strip(),)
        )
        rows = cur.fetchall()

        medical_history = [
            {
                "historyID": row[0],
                "diagnosis": row[1]
            }
            for row in rows
        ]

        return {"medicalHistory": medical_history}

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

@app.get("/get-patient-visits", dependencies=[Depends(RoleChecker(["Provider", "Admin"]))])
async def get_patient_visits(patientID: str):
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT v.visitID, v.providerID, pr.lastName, v.visitTimeStamp, v.purpose, v.walkIn FROM visit v LEFT JOIN healthcareprovider pr ON v.providerID = pr.providerID WHERE v.patientID = %s",
            (patientID.strip(),)
        )
        visits = cur.fetchall()
        visit_list = [
            {
                "visitID": row[0],
                "providerID": row[1],
                "lastName": row[2],
                "visitTimeStamp": row[3],
                "purpose": row[4],
                "walkIn": row[5]
            }
            for row in visits]

        return {"visits": sorted(visit_list, key=lambda x: x["visitTimeStamp"], reverse=True)}

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

@app.get("/get-current-account-id")
async def get_current_account_id(current_user: Annotated[User, Depends(get_current_active_user)]):
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT accountID FROM useraccount WHERE username = %s",
            (current_user.username,)
        )
        row = cur.fetchone()

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )

        return {"accountID": row[0]}

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

@app.get("/get-patient-billing-history", dependencies=[Depends(RoleChecker(["Provider", "Admin"]))])
async def get_patient_billing_history(patientID: str):
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT b.billingID, b.visitID, b.patientID, b.amount, v.visitTimeStamp, b.status FROM billing b LEFT "
            "JOIN visit v ON b.visitID = v.visitID WHERE b.patientID = %s",
            (patientID.strip(),)
        )

        billing_history = cur.fetchall()
        billing_list = [
            {
                "billingID": billing[0],
                "visitID": billing[1],
                "patientID": billing[2],
                "amount": billing[3],
                "visitTimeStamp": billing[4],
                "status": billing[5]
            }
            for billing in billing_history
        ]
        return {"billingHistory": sorted(billing_list, key=lambda x: x['visitTimeStamp'], reverse=True)}

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
            "SELECT password, role FROM useraccount WHERE username = %s",
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
            "SELECT username FROM useraccount WHERE username = %s",
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

        cur.execute("SELECT departmentID FROM department WHERE departmentID = %s", (data.departmentID,))
        department_row = cur.fetchone()

        if department_row is None:
            raise HTTPException(status_code=400, detail="Invalid department ID")

        cur.execute(
            "SELECT accountID FROM healthcareprovider WHERE accountID = %s",
            (data.accountID,)
        )
        provider_row = cur.fetchone()
        if provider_row is not None:
            raise HTTPException(status_code=400, detail="Employee already exists as a provider")

        cur.execute(
            "SELECT firstName, lastName FROM patient WHERE accountID = %s",
            (data.accountID,)
        )
        patient_row = cur.fetchone()
        if patient_row is None:
            raise HTTPException(status_code=400, detail="Patient/Account does not exist")

        firstName = patient_row['firstName']
        lastName = patient_row['lastName']

        cur.execute(
            "UPDATE useraccount SET role = 'Provider' WHERE accountID = %s",
            (data.accountID,)
        )

        cur.execute(
            """INSERT INTO healthcareprovider
                   (accountID, departmentID, firstName, lastName, providerType, specialty)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (data.accountID, data.departmentID, firstName, lastName,
             data.providerType, data.specialty)
        )

        conn.commit()

        return {"success": True, "message": f"Provider {firstName} {lastName} added successfully"}

    except HTTPException:
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Server error: {str(e)}"
        )
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
            "SELECT accountID FROM healthcareprovider WHERE accountID = %s",
            (data.accountID,)
        )
        provider_row = cur.fetchone()
        if provider_row is None:
            raise HTTPException(status_code=404, detail="Provider not found")

        cur.execute(
            "DELETE FROM healthcareprovider WHERE accountID = %s",
            (data.accountID,)
        )
        cur.execute(
            "UPDATE useraccount SET role = 'Patient' WHERE accountID = %s",
            (data.accountID,)
        )

        conn.commit()

        return {"success": True, "message": "Provider removed successfully"}

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