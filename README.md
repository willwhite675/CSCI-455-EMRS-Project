# CSCI-455-EMRS-Project
Basic web page for our EMRS project to allow interaction with a database

<!-- TOC -->
* [Compilation](#compilation)
* [Database Setup Using HeidiSQL](#database-setup-using-heidisql)
* [Web Page Link](#web-page-link)

## Compilation
The front end of this project uses HTML, CSS, and Typescript compiled into JavaScript. To compile the project after making
changes, run the following command in the terminal from the project directory:
```text
npm run build
```

## Database Setup Using HeidiSQL

1. Install MariaDB
2. Copy `.env.example` to `.env` and fill in your local database credentials
3. Open HeidiSQL and create a new session (or use existing if you want)
4. Enter connection details:  
    - Network Type: `MariaDB or MySQL (TCP/IP)`
    - Hostname/IP: `localhost`
    - User: `root` or whatever you named it
    - Password: Your database password 
    - Port: `3306`
5. Click **Open**
6. Go to **File &rarr; Load SQL File**
7. Select `db/schema.sql`
8. Click **Execute**

Each person uses their own local MariaDB instance. Database credentials are stored in `.env`, DO NOT commit to git

## Web Page Link
<a>https://willwhite675.github.io/CSCI-455-EMRS-Project/</a>
