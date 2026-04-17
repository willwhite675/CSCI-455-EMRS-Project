# CSCI-455-EMRS-Project

Electronic Medical Records System (EMRS) - A full-stack web application for managing patient records, healthcare providers, appointments, and billing.

## Table of Contents
* [Prerequisites](#prerequisites)
* [Technology Stack](#technology-stack)
* [Installation](#installation)
   * [1. Clone the Repository](#1-clone-the-repository)
   * [2. Database Setup](#2-database-setup)
   * [3. Python Backend Setup](#3-python-backend-setup)
   * [4. Frontend Setup](#4-frontend-setup)
* [Running the Application](#running-the-application)
* [Project Structure](#project-structure)
* [Default Credentials](#default-credentials)
* [Development Workflow](#development-workflow)
* [Important Notes](#important-notes)
* [Troubleshooting](#troubleshooting)
* [Web Page Link](#web-page-link)

---

## Prerequisites

Before setting up this project, ensure you have the following installed:

* **Python 3.14** or higher
* **Node.js** and **npm**
* **MariaDB** (version 10.x or higher recommended)
* **Git**

## Technology Stack

**Backend:**
* Python 3.14.4
* FastAPI 0.135.2
* MariaDB 1.1.14
* Uvicorn (ASGI server)
* Pycryptodome (for password hashing)

**Frontend:**
* TypeScript 6.0.2
* HTML5/CSS3
* jQuery 3.7.1
* DataTables 2.3.7

**Database:**
* MariaDB

## Installation

### 1. Clone the Repository

    git clone <repository-url>
    cd CSCI-455-EMRS-Project

### 2. Database Setup

**Install MariaDB**
1. Go to https://mariadb.org/download/
2. Download the latest version of MariaDB.
3. Run the file once it's downloaded.
4. Follow the onscreen prompts.
5. Leave the default options, but name the server root and remember the password you enter. That is what will be used when setting up HeidiSQL.

**Create and Configure Database**
1. Install HeidiSQL (recommended GUI client) or use the MariaDB command line.
2. Create Environment Configuration:

   cp .env.example .env

3. Edit your `.env` file with your database credentials:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=emrs_database
   DB_USER=root
   DB_PASSWORD=your_password_here
   ```

   > **IMPORTANT:** Never commit `.env` to git!

**Initialize the Database**

*Using HeidiSQL:*
1. Open HeidiSQL and create a new session (or use an existing one if you want).
2. Connection settings:
   * **Network Type:** MariaDB or MySQL (TCP/IP)
   * **Hostname/IP:** localhost
   * **User:** root
   * **Password:** Your database password
   * **Port:** 3306
3. Click Open.
4. Go to File → Load SQL File.
5. Select `db/schema.sql`.
6. Click Execute.

*OR Using Command Line:*

    mysql -u root -p < db/schema.sql

*(Optional) Load Test Data:*

    mysql -u root -p emrs_database < db/test-data.sql

### 3. Python Backend Setup

**Create Virtual Environment:**

    python -m venv .venv

**Activate Virtual Environment:**

*Windows:*

    .venv\Scripts\activate

*macOS/Linux:*

    source .venv/bin/activate

**Install Python Dependencies:**

    pip install -r requirements.txt

This will install all required packages including:
* FastAPI and Uvicorn (web framework & server)
* MariaDB connector
* Pydantic (data validation)
* Pycryptodome (encryption)
* Python-dotenv (environment variables)
* And all other dependencies

*Alternative (if you want to install manually):*

    pip install "fastapi[standard]"
    pip install swagger-ui

### 4. Frontend Setup

**Install Node.js Dependencies:**

    npm install

This will install:
* TypeScript compiler
* DataTables library
* Type definitions for jQuery and Node.js
* dotenv for environment variables
* MariaDB connector for Node.js

**Compile TypeScript to JavaScript:**

    npm run build

This compiles all TypeScript files in `client/public/src/` to JavaScript.
## Running the Application

### Start the Backend Server

1. Activate the virtual environment (if not already activated):

   ### Windows
   `.venv\Scripts\activate`

   ### macOS/Linux
   `source .venv/bin/activate`


2. Run the FastAPI server:
   ```
   cd server uvicorn main:app --reload --port 8001
   ```

The API will be available at `http://localhost:8001`.
* **API Documentation (Swagger):** `http://localhost:8001/docs`
* **Alternative API Docs (ReDoc):** `http://localhost:8001/redoc`

### Start the Frontend

Open the application in your web browser:
* Open `index.html` in a browser.
* OR use a local development server (recommended):

  # Using Python's built-in server
  `python -m http.server 8000`

Then navigate to `http://localhost:8000`.

---

## Project Structure

    CSCI-455-EMRS-Project/
    ├── client/                    # Frontend code
    │   └── public/
    │       ├── appointments/      # Appointments page
    │       ├── billing/           # Billing page
    │       ├── dashboard/         # Dashboard page
    │       ├── login/             # Login page
    │       ├── patients/          # Patients management
    │       ├── management-panel/  # Admin panel
    │       ├── settings/          # Settings page
    │       └── src/               # TypeScript source files
    ├── server/                    # Backend code
    │   ├── main.py                # FastAPI application
    │   └── security.py            # Password hashing utilities
    ├── db/                        # Database files
    │   ├── schema.sql             # Database schema
    │   └── test-data.sql          # Sample data
    ├── config/                    # TypeScript configuration
    ├── .env                       # Environment variables (DO NOT COMMIT)
    ├── .env.example               # Example environment file
    ├── requirements.txt           # Python dependencies
    ├── package.json               # Node.js dependencies
    └── tsconfig.json              # TypeScript configuration

---

## Default Credentials

After loading the test data, you can log in with:

**Admin Account:**
* **Username:** dave
* **Password:** dave

This account has full access to all features including the management panel.

---

## Development Workflow

1. Make changes to TypeScript files in `client/public/src/`.
2. Rebuild the frontend:

   npm run build

3. Restart the backend if you made changes to Python files (or use the `--reload` flag with uvicorn).

---

## Important Notes

* Each developer uses their own local MariaDB instance.
* Database credentials are stored in `.env` - **DO NOT commit this file to git**.
* The `.env.example` file shows the required format.
* Always activate the Python virtual environment before running the backend.
* The frontend uses session storage for authentication tokens.
* The API runs on port 8001, and the frontend typically runs on 8000.

---

## Troubleshooting

**Database Connection Issues:**
* Verify MariaDB is running.
* Check that credentials in your `.env` are correct.
* Ensure `emrs_database` exists.

**Import Errors:**
* Make sure your virtual environment is activated.
* Run `pip install -r requirements.txt` again.

**TypeScript Compilation Errors:**
* Run `npm install` to ensure all dependencies are installed.
* Check for syntax errors in `.ts` files.

**CORS Errors:**
* Ensure the backend is running on port 8001.
* Check CORS settings in `server/main.py`.

**Python Virtual Environment Issues (IntelliJ/PyCharm):**
1. Navigate to File → Project Structure.
2. Under Project Structure navigate to Platform Settings → SDKs.
3. Click the `+` button and select "Add Python SDK from disk".
4. Make sure "Virtualenv" is selected and click OK.

---

## Web Page Link

[CSCI-455 EMRS Project Pages](https://willwhite675.github.io/CSCI-455-EMRS-Project/)