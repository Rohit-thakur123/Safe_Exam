import { Router } from 'express';
import { runCode } from '../controllers/compiler.controller.js';
import { validateRunRequest } from '../middlewares/validation.js';

const router = Router();

router.post('/run', validateRunRequest, runCode);

export default router;
