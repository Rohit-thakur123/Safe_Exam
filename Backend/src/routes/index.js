import express from 'express';
import QuestionRouter from "./question.routes.js";
import CodingQuestionRouter from "./codingQuestion.routes.js";
import ExamRouter from "./exam.routes.js";
import AuthRouter from "./auth.routes.js";
import ExamAttemptRouter from "./examAttempt.routes.js";
import SessionRouter from "./session.routes.js";
import SEBRouter from "./seb.routes.js";
import CategoryRouter from "./category.routes.js";
import CodingExecutionRouter from "./codingExecution.routes.js";

const router = express.Router();

router.get('/', (req, res) => {
    res.send('Welcome to the Home Page');
});

router.use('/auth', AuthRouter);
router.use('/questions', QuestionRouter);
router.use('/coding-questions', CodingQuestionRouter);
router.use('/coding-assessments', CodingExecutionRouter);
router.use('/categories', CategoryRouter);
router.use('/exams', ExamRouter);
router.use('/exam-attempts', ExamAttemptRouter);
router.use('/sessions', SessionRouter);
router.use('/seb', SEBRouter);

export default router;
