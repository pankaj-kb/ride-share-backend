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
                return new Error("User Already Exists", 409);
            }

            const securePass = await bcrypt.hash(password, 10);
            const [result] = await pool.execute(
                `INSERT INTO users (username, email, fullName, password, age, vehicle) VALUES (?, ?, ?, ?, ?, ?)`,
                [username, email, fullName, securePass, age, vehicle]
            );
            return result.insertId;
        } catch (error) {
            return new Error(`Error Creating User: ${error.message}`);
        }
    },

    async loginUser(loginId, password) {
        try {
            const [user] = await pool.execute(
                `SELECT * FROM users WHERE username = ? OR email = ?`,
                [loginId, loginId]
            );

            if (!user || !user[0]) {
                return new Error(`User not found: ${loginId}`, 404);
            }

            const isPasswordCorrect = await bcrypt.compare(password, user[0].password);

            if (!isPasswordCorrect) {
                return new Error('Incorrect Password', 401);
            }

            const accessToken = await this.generateAccessToken(user[0].id, user[0].email, user[0].username, user[0].fullName);
            const refreshToken = await this.generateRefreshToken(user[0].id);

            return {
                message: 'User logged in successfully',
                user: {
                    userId: user[0].id,
                    username: user[0].username,
                    email: user[0].email,
                    fullName: user[0].fullName,
                },
                accessToken,
                refreshToken,
            };
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return new Error(`Error While Logging in: ${error.message}`, statusCode);
        }
    },

    async logoutUser(userId) {
        try {
            const [result] = await pool.execute(
                'UPDATE users SET refreshToken = NULL WHERE id = ?',
                [userId]
            );

            if (result.affectedRows === 0) {
                return new Error('User not found or refreshToken not updated');
            }

            return "User Logged Out.";
        } catch (error) {
            return new Error(`Error logging out user: ${error.message}`);
        }
    },

    async getCurrentUser(userId) {
        try {
            const [user] = await pool.execute(
                `SELECT * FROM users WHERE id = ?`, [userId]
            );
            if (!user || user.length === 0) {
                return new Error("User not found", 404);
            }
            return user[0];
        } catch (error) {
            return new Error(`Error fetching the current User: ${error.message}`);
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