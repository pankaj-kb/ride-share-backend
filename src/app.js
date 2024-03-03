import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
const allowedOrigins = ['http://localhost:5173', 'http://192.168.1.2:5173'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}))

app.use(express.json({limit: "20kb"}))
app.use(express.urlencoded({ extended: true, limit: "20kb" }))
app.use(express.static("public"))
app.use(cookieParser())

app.get("/", (req, res) => {
    res.send("<h1>Server running</h1>");
})

export { app }