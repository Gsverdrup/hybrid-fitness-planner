import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser";
import usersRouter from "./routes/users";
import planRouter from "./routes/plan";
import racePlanRouter from "./routes/racePlan";
import authRouter from "./routes/auth";
import savedPlansRouter from "./routes/plans";

const app = express();
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

app.use(cors({
  origin: clientOrigin,
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

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});