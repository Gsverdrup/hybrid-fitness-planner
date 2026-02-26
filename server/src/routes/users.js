import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { findUserById } from "../repositories/userRepository";
const router = Router();
router.get("/me", requireAuth, async (req, res) => {
    const user = await findUserById(req.userId);
    if (!user) {
        return res.status(404).json({ error: "User not found." });
    }
    res.json({ user });
});
export default router;
