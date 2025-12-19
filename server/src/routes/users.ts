import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.get("/", async (_req, res) => {
  const result = await pool.query("SELECT * FROM users");
  res.json(result.rows);
});

export default router;
