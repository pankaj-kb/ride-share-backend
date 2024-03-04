import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const verifyJWT = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            const unauthorizedError = new Error("Unauthorized request");
            unauthorizedError.statusCode = 401;
            throw unauthorizedError;
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.checkExist(decodedToken?.username, decodedToken?.email);

        if (!user.length) {
            const invalidTokenError = new Error("Invalid Access Token");
            invalidTokenError.statusCode = 401;
            throw invalidTokenError;
        }

        req.user = user;

        next();
    } catch (error) {
        const statusCode = error.statusCode || 401;
        throw new Error(statusCode, error?.message || "Invalid Access token");
    }
};
