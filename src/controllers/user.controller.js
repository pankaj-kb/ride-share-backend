import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

async function registerUser(req, res) {
    try {
        const { username, email, fullName, password, age, vehicle } = req.body;

        if ([fullName, email, username, password, age].some((field) => field.trim() === "")) {
            throw new Error("All fields are required", 400);
        }

        const checkExist = await User.checkExist(username, email);

        if (checkExist.length > 0) {
            throw new Error("User Already Exists", 409);
        }

        const userId = await User.registerUser(username, email, fullName, password, age, vehicle);
        res.status(201).json({ userId });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ error: error.message });
    }
}

export {
    registerUser,
};
