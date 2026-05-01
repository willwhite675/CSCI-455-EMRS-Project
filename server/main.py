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
    accountID: int | None = None

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

def get_user_by_account_id(account_id: int):
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT username, password, email, role FROM useraccount WHERE accountID = %s",
            (account_id,)
        )
        row = cur.fetchone()

        if row:
            return UserInDB(
                username=row[0],
                hashed_password=row[1],
                email=row[2],
                role=row[3],
                accountID=account_id,
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
    try:
        account_id = int(token)
        user = get_user_by_account_id(account_id)
        return user
    except (ValueError, TypeError):
        return None

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

@app.get("/get-self-allergies", dependencies=[Depends(RoleChecker(["Patient", "Provider", "Admin"]))])
async def get_self_allergies(current_user: Annotated[User, Depends(get_current_active_user)]):
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
                    SELECT patientID FROM patient WHERE accountID = %s
                    
                    """, (current_user.accountID,))
        
        patient_row = cur.fetchone()
        if not patient_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient record not found"
            )
        
        patient_id = patient_row[0]

        cur.execute("""
                    SELECT
                        allergen
                    FROM patientallergy
                    WHERE patientID = %s
                    """, (patient_id,))

        allergies = cur.fetchall()
        return {"success": True, "allergies": allergies}

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
@app.get("/get-self-by-id", dependencies=[Depends(RoleChecker(["Patient", "Provider", "Admin"]))])
async def get_self_by_id(current_user: Annotated[User, Depends(get_current_active_user)]):
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT accountID FROM useraccount WHERE username = %s",
            (current_user.username,)
        )
        account_row = cur.fetchone()
        
        if not account_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )

        cur.execute(
            "SELECT patientID, firstName, lastName, DOB, phoneNumber, gender, insuranceDetails FROM patient WHERE accountID = %s",
            (account_row[0],)
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

@app.get("/get-self-medical-history", dependencies=[Depends(RoleChecker(["Patient", "Provider", "Admin"]))])
async def get_self_medical_history(current_user: Annotated[User, Depends(get_current_active_user)]):
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT historyID, diagnosis FROM patienthistory WHERE patientID = (SELECT patientID FROM patient WHERE accountID = %s)",
            (current_user.accountID,)
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

@app.get("/get-self-visits", dependencies=[Depends(RoleChecker(["Patient", "Provider", "Admin"]))])
async def get_self_visits(current_user: Annotated[User, Depends(get_current_active_user)]):
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT v.visitID, v.providerID, pr.lastName, v.visitTimeStamp, v.purpose, v.walkIn FROM visit v LEFT JOIN healthcareprovider pr ON v.providerID = pr.providerID WHERE v.patientID = (SELECT patientID FROM patient WHERE accountID = %s)",
            (current_user.accountID,)
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

@app.get("/get-self-appointments", dependencies=[Depends(RoleChecker(["Patient", "Provider", "Admin"]))])
async def get_self_appointments(current_user: Annotated[User, Depends(get_current_active_user)]):
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("SELECT patientID from Patient WHERE accountID = (SELECT accountID FROM useraccount WHERE username = %s)", (current_user.username,))

        patientID = cur.fetchone()[0]

        cur.execute("""
                    SELECT
                        a.appointmentID,
                        a.providerID,
                        pr.lastName,
                        a.patientID,
                        a.appointmentTimestamp,
                        a.reason,
                        a.status
                    FROM 
                        appointment a JOIN healthCareProvider pr ON a.providerID = pr.providerID 
                    WHERE patientID = %s""",
                    (patientID,))

        appointments = cur.fetchall()
        appointment_list = [
            {
                "appointmentID": row[0],
                "providerID": row[1],
                "providerLastName": row[2],
                "patientID": row[3],
                "appointmentDate": row[4].strftime("%Y-%m-%d") if row[4] else None,
                "appointmentTime": row[4].strftime("%H:%M") if row[4] else None,
                "reason": row[5],
                "status": row[6]
            }
            for row in appointments
        ]

        return {"appointments": sorted(appointment_list, key=lambda x: x["appointmentDate"] or "", reverse=True)}

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

@app.get("/get-patient-appointments", dependencies=[Depends(RoleChecker(["Provider", "Admin"]))])
async def get_patient_appointments():
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
                    SELECT
                        a.appointmentID,
                        a.providerID,
                        pr.lastName,
                        a.patientID,
                        pa.firstName,
                        pa.lastName,
                        a.appointmentTimestamp,
                        a.reason,
                        a.status
                    FROM
                        appointment a JOIN healthCareProvider pr ON a.providerID = pr.providerID
                        JOIN patient pa ON a.patientID = pa.patientID
                    """,
                    )

        appointments = cur.fetchall()
        appointment_list = [
            {
                "appointmentID": row[0],
                "providerID": row[1],
                "providerLastName": row[2],
                "patientID": row[3],
                "patientFirstName": row[4],
                "patientLastName": row[5],
                "appointmentDate": row[6].strftime("%Y-%m-%d") if row[6] else None,
                "appointmentTime": row[6].strftime("%H:%M") if row[6] else None,
                "reason": row[7],
                "status": row[8]
            }
            for row in appointments]

        return {"appointments": sorted(appointment_list, key=lambda x: x["appointmentDate"], reverse=True)}

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

@app.get("/get-self-billing-history", dependencies=[Depends(RoleChecker(["Patient", "Provider", "Admin"]))])
async def get_self_billing_history(current_user: Annotated[User, Depends(get_current_active_user)]):
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT patientID FROM patient WHERE accountID = (
                SELECT accountID FROM useraccount WHERE username = %s
            )
            """, (current_user.username,))
        
        patient_row = cur.fetchone()
        if not patient_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient record not found"
            )
        
        patient_id = patient_row[0]

        cur.execute(
            "SELECT b.billingID, b.visitID, b.patientID, b.amount, v.visitTimeStamp, b.status FROM billing b LEFT "
            "JOIN visit v ON b.visitID = v.visitID WHERE b.patientID = %s",
            (patient_id,)
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

@app.get("/get-my-labs", dependencies=[Depends(RoleChecker(["Patient", "Provider", "Admin"]))])
async def my_labs(current_user: Annotated[User, Depends(get_current_active_user)]):
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            """SELECT 
               labResultID,
                testName,
                testDate,
                resultValue,
                referenceRange,
                status,
                notes 
               FROM labResult WHERE patientID = (SELECT patientID FROM patient WHERE accountID = %s)""",
            (current_user.accountID,)
        )
        labs = cur.fetchall()
        lab_list = [
            {
                "labResultID": lab[0],
                "testName": lab[1],
                "resultValue": lab[3],
                "testDate": lab[2],
                "referenceRange": lab[4],
                "status": lab[5],
                "notes": lab[6]
            }
            for lab in labs
        ]
        return {"labs": lab_list}

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

@app.get("/get-patient-lab-results", dependencies=[Depends(RoleChecker(["Provider", "Admin"]))])
async def get_patient_lab_results(patientID: str):
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT
                l.labResultID,
                p.firstName,
                p.lastName,
                l.testName,
                l.testDate,
                l.resultValue,
                l.referenceRange,
                l.status,
                l.notes
            FROM labResult l
                     LEFT JOIN patient p ON l.patientID = p.patientID
            WHERE l.patientID = %s
            """, (patientID,)
        )

        labs = cur.fetchall()
        labResults = [
            {
                "labResultID": row[0],
                "firstName": row[1],
                "lastName": row[2],
                "testName": row[3],
                "testDate": row[4],
                "resultValue": row[5],
                "referenceRange": row[6],
                "status": row[7],
                "notes": row[8]
            }
            for row in labs
        ]

        return {"labResults": labResults}

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

        cur.execute(
            "SELECT accountID FROM useraccount WHERE username = %s",
            (form_data.username.strip(),)
        )
        account_id = cur.fetchone()[0]

        # For now, using account id as token
        return {
            "access_token": account_id,
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

        if data.departmentID == 6:
            cur.execute(
                "UPDATE useraccount SET role = 'Admin' WHERE accountID = %s",
                (data.accountID,)
            )
        else:
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