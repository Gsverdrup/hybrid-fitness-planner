import express from 'express';
import cors from 'cors';
import usersRouter from "./routes/users";
import planRouter from "./routes/plan";
import racePlanRouter from "./routes/racePlan";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/users", usersRouter);
app.use("/plan", planRouter);
app.use("/race-plan", racePlanRouter);

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});