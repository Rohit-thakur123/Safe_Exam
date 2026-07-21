import express from "express";

import {
  saveDraft,
  getAnswer,
  submitAnswer,
  getExamAnswers,
  getStudentAnswers,
  evaluateAnswer,
} from "../controllers/descriptive.controller.js";
import { authenticateToken, authorizeRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({ message: "Descriptive router is working" });
});

// ─── Teacher-only routes (must come BEFORE parameterized student routes) ────
router.get("/exam/:examId", authenticateToken, authorizeRole(["teacher"]), getExamAnswers);
router.get("/exam/:examId/student/:studentId", authenticateToken, authorizeRole(["teacher"]), getStudentAnswers);
router.post("/evaluate", authenticateToken, authorizeRole(["teacher"]), evaluateAnswer);

// ─── Student routes (authenticated, also called from SEB with SEB token) ─────
router.post("/save", authenticateToken, saveDraft);
router.post("/submit", authenticateToken, submitAnswer);
router.get("/:attemptId/:questionId", authenticateToken, getAnswer);

export default router;