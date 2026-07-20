import express from "express";

import {
  saveDraft,
  getAnswer,
  submitAnswer,
} from "../controllers/descriptive.controller.js"

const router = express.Router();

/**
 * Save Draft
 */
router.post("/save", saveDraft);

/**
 * Get Saved Answer
 */
router.get("/:attemptId/:questionId", getAnswer);

/**
 * Final Submit
 */
router.post("/submit", submitAnswer);

export default router;