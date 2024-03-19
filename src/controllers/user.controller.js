import User from "../models/user.model.js";

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
        return res.status(201).json({ userId });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ error: error.message });
    }
}

async function loginUser(req, res) {
    try {
        const { loginId, password } = req.body;
        console.log(loginId, password)
        if ([loginId, password].some((field) => field.trim() === "")) {
            throw new Error("All fields are required", 400);
        }
        const response = await User.loginUser(loginId, password);
        console.log(response)
        res.status(201)
            .cookie("accessToken", response.accessToken)
            .cookie("refreshToken", response.refreshToken)
            .json(response)

    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ error: error.message });
    }
}

async function logoutUser(req, res) {
    try {
        console.log("line 49: ", req.user);
        const response = await User.logoutUser(req.user.id);
        res.clearCookie("accessToken")
            .clearCookie("refreshToken")
            .status(201)
            .json(response);
    } catch (error) {
        res.status(500).json({ error: `Error logging out user: ${error.message}` });
    }
}

async function getCurrentUser(req, res) {
    const user = req.user;
    res.status(201)
        .json(user)
}

export {
    registerUser,
    loginUser,
    logoutUser,
};
