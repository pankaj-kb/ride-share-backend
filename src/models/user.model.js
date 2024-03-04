import pool from "../db/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const User = {

    async checkExist(username, email) {
        const [result] = await pool.execute(
            'SELECT id, username, email, fullName, age, vehicle FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        return result;
    },

    async registerUser(username, email, fullName, password, age, vehicle) {
        try {
            const checkExist = await pool.execute(
                'SELECT * FROM users WHERE username = ? OR email = ?',
                [username, email]
            );

            if (checkExist[0].length > 0) {
                throw new Error("User Already Exists.")
            }

            const securePass = await bcrypt.hash(password, 10);
            const [result] = await pool.execute(
                `INSERT INTO users (username, email, fullName, password, age, vehicle) VALUES (?, ?, ?, ?, ?, ?)`,
                [username, email, fullName, securePass, age, vehicle]
            );
            return result.insertId;
        } catch (error) {
            throw new Error(`Error Creating User: ${error.message}`);
        }
    },

    async loginUser(loginId, password) {
        try {
            const [user] = await pool.execute(
                `SELECT * FROM users WHERE username = ? OR email = ?`,
                [loginId, loginId]
            );
            if (!user || !user[0]) {
                throw new Error('User not found');
            }

            const isPasswordCorrect = await bcrypt.compare(password, user[0].password);

            if (!isPasswordCorrect) {
                throw new Error(`Incorrect Password`);
            }

            const accessToken = this.generateAccessToken(user[0].id, user[0].email, user[0].username, user[0].fullName);

            const refreshToken = this.generateRefreshToken(user[0].id);

            return { accessToken, refreshToken };
        } catch (error) {
            throw new Error(`Error While Logging in: ${error.message}`);
        }
    },

    async logoutUser(userId) {
        try {
            const [result] = await pool.execute(
                'UPDATE users SET refreshToken = NULL WHERE id = ?',
                [userId]
            );

            if (result.affectedRows === 0) {
                throw new Error('User not found or refreshToken not updated');
            }

            return true;
        } catch (error) {
            throw new Error(`Error logging out user: ${error.message}`);
        }
    },

    async generateAccessToken(userId, email, username, fullName) {
        const accessToken = jwt.sign(
            { userId, email, username, fullName },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
        );
        return accessToken;
    },

    async generateRefreshToken(userId) {
        const refreshToken = jwt.sign(
            { userId },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
        );
        await pool.execute('UPDATE users SET refreshToken = ? WHERE id = ?', [refreshToken, userId]);
        return refreshToken;
    },
};

export default User;
