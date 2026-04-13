from typing import Annotated, List
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
        if user.userType not in self.allowed_roles:
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
    firstName: str | None = None
    lastName: str | None = None
    disabled: bool | None = None
    userType: str | None = None

class UserInDB(User):
    hashed_password: str

class CreateAccount(BaseModel):
    username: str
    password: str
    firstName: str
    lastName: str
    phoneNumber: str
    age: int
    gender: str
    email: str
    userType: str

class AddProvider(BaseModel):
    employeeID: str
    providerID: str
    departmentID: str

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
            "SELECT ID, authCredentials, firstName, lastName, email, userType FROM user WHERE ID = ?",
            (username.strip(),)
        )
        row = cur.fetchone()

        if row:
            return UserInDB(
                username=row[0],
                hashed_password=row[1],
                firstName=row[2],
                lastName=row[3],
                email=row[4],
                userType=row[5],
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
                        hp.ID,
                        u.firstName,
                        u.lastName,
                        u.email,
                        hp.providerID,
                        hp.departmentID,
                        d.departmentName
                    FROM healthcareprovider hp
                        LEFT JOIN user u ON hp.ID = u.ID
                        LEFT JOIN department d ON hp.departmentID = d.departmentID
                    """)
        providers = cur.fetchall()
        provider_list = [
            {
                "ID": row[0],
                "firstName": row[1],
                "lastName": row[2],
                "email": row[3],
                "providerID": row[4],
                "departmentID": row[5],
                "departmentName": row[6]
            }
            for row in providers
        ]

        return {"providers": sorted(provider_list, key=lambda x: x["firstName"])}

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
                        p.ID,
                        u.firstName,
                        u.lastName,
                        u.email,
                        p.allergyProfile,
                        p.insuranceDetails,
                        p.lastVisit
                    FROM patient p
                             LEFT JOIN user u ON p.ID = u.ID
                    """)
        patients = cur.fetchall()
        patient_list = [
            {
                "ID": row[0],
                "firstName": row[1],
                "lastName": row[2],
                "email": row[3],
                "allergyProfile": row[4],
                "insuranceDetails": row[5],
                "lastVisit": row[6]
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

@app.post("/token")
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    # OAuth2 token login endpoint
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT authCredentials, userType FROM user WHERE id = ?",
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
        cur.execute(
            "SELECT ID FROM administrator WHERE ID = ?",
            (form_data.username.strip(),)
        )
        admin_row = cur.fetchone()
        is_admin = admin_row is not None

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
        cur = conn.cursor()

        hashed_password = hash_password(data.password.strip())

        cur.execute(
            "SELECT ID FROM user WHERE ID = ?",
            (data.username.strip(),)
        )
        user_row = cur.fetchone()
        if user_row is not None:
            raise HTTPException(status_code=400, detail="User already exists")

        cur.execute(
            "INSERT INTO user (ID, authCredentials, firstName, lastName, phonenumber, age, gender, email, twoFactorEnabled, userType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (data.username.strip(), hashed_password, data.firstName.strip(), data.lastName.strip(), data.phoneNumber.strip(), data.age, data.gender.strip(), data.email.strip(), False, data.userType.strip())
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

@app.post("/add-provider", dependencies=[Depends(RoleChecker(["Admin"]))])
async def add_provider(data: AddProvider):
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        if data.employeeID.strip() == "" or data.providerID.strip() == "" or data.departmentID.strip() == "":
            raise HTTPException(status_code=400, detail="Username, Provider ID, and department ID cannot be empty")

        if data.departmentID.strip() not in ["1", "2", "3", "4", "5"]:
            raise HTTPException(status_code=400, detail="Invalid department ID")

        cur.execute(
            "SELECT ID FROM healthcareprovider WHERE ID = ?",
            (data.employeeID.strip(),)
        )
        provider_row = cur.fetchone()
        if provider_row is not None:
            raise HTTPException(status_code=400, detail="Employee already exists")

        cur.execute(
            "UPDATE user SET userType = 'Provider' WHERE ID = ?",
            (data.employeeID.strip(),)
        )

        cur.execute(
            "INSERT INTO healthcareprovider (ID, providerID, departmentID) VALUES (?, ?, ?)",
            (data.employeeID.strip(), data.providerID.strip(), data.departmentID.strip())
        )

        conn.commit()

        if cur.rowcount > 0:
            return {"success": True, "message": "Provider added successfully"}
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