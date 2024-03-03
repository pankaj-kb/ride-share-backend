import dotenv from 'dotenv'
import pool from "./db/index.js";
import { app } from './app.js';
dotenv.config({
    path: './.env'
})

const PORT = process.env.PORT || 8000;

async function startApp() {
    try {
        await pool.getConnection()
        console.log('Database connected successfully!');
        app.listen(PORT, () => {
            console.log(`Server is running at http://localhost:${PORT}`)
        })
    } catch (error) {
        console.error('Error connecting to the database:', error.message);
        process.exit(1);
    }
}

startApp();