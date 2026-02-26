import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser";
import usersRouter from "./routes/users";
import planRouter from "./routes/plan";
import racePlanRouter from "./routes/racePlan";
import authRouter from "./routes/auth";
import savedPlansRouter from "./routes/plans";
const app = express();
const configuredOrigins = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const fallbackDevOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
];
const allowedOrigins = new Set([...fallbackDevOrigins, ...configuredOrigins]);
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use("/users", usersRouter);
app.use("/plan", planRouter);
app.use("/race-plan", racePlanRouter);
app.use("/auth", authRouter);
app.use("/plans", savedPlansRouter);
app.get('/health', (_, res) => {
    res.json({ status: 'ok' });
});
const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
