import * as dotenv from 'dotenv';
import mariadb from 'mariadb';

dotenv.config();

export const pool = mariadb.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionLimit: 5
});

export async function getConnection() {
    try {
        return await pool.getConnection();
    } catch (err) {
        console.error('Database connection failed:', err);
        throw err;
    }
}