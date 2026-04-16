# CSCI-455-EMRS-Project
Basic web page for our EMRS project to allow interaction with a database

<!-- TOC -->
## Table of Contents
* [Backend](#backend)
* [Compilation](#compilation)
* [Installing MariaDB](#installing-mariadb)
* [Database Setup Using HeidiSQL](#database-setup-using-heidisql)
* [Web Page Link](#web-page-link)

## Compilation
The front end of this project uses HTML, CSS, and Typescript compiled into JavaScript. To compile the project after making
changes, run the following command in the terminal from the project directory:
```text
npm run build
```

## Installing MariaDB
1. Got to https://mariadb.org/download/
2. Download the latest version of MariaDB
3. Run the file once it's downloaded
4. Follow the onscreen prompts
5. Leave the default options, but name the server `root` and remember the password you enter. That is what will be used when setting up HeidiSQL

## Database Setup Using HeidiSQL

1. Make sure MariaDB is installed
2. Install HeidiSQL
3. Copy `.env.example` to `.env` and fill in your local database credentials
4. Open HeidiSQL and create a new session (or use existing if you want)
5. Enter connection details:  
    - Network Type: `MariaDB or MySQL (TCP/IP)`
    - Hostname/IP: `localhost`
    - User: `root` or whatever you named it
    - Password: Your database password 
    - Port: `3306`
6. Click **Open**
7. Go to **File &rarr; Load SQL File**
8. Select `db/schema.sql`
9. Click **Execute**
10. Default admin for this system is: username: `dave` and password `dave`

Each person uses their own local MariaDB instance. Database credentials are stored in `.env`, DO NOT commit to git

## Web Page Link
<a>https://willwhite675.github.io/CSCI-455-EMRS-Project/</a>
