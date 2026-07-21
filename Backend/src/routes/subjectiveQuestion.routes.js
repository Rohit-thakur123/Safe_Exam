import express from "express";
import {
  createSubjectiveQuestion,
  getAllSubjectiveQuestions,
  getSubjectiveQuestionById,
  updateSubjectiveQuestion,
  deleteSubjectiveQuestion,
} from "../controllers/subjectiveQuestion.controller.js";
import { authenticateToken, authorizeRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Teacher-only routes (full CRUD)
router.post("/", authenticateToken, authorizeRole(["teacher"]), createSubjectiveQuestion);
router.get("/", authenticateToken, authorizeRole(["teacher"]), getAllSubjectiveQuestions);
router.put("/:id", authenticateToken, authorizeRole(["teacher"]), updateSubjectiveQuestion);
router.delete("/:id", authenticateToken, authorizeRole(["teacher"]), deleteSubjectiveQuestion);

// Both roles (teacher sees all fields; student sees filtered view via controller)
router.get("/:id", authenticateToken, getSubjectiveQuestionById);

export default router;
