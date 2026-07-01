import { Router } from 'express';
import { runCode } from '../controllers/compiler.controller.js';
import { validateRunRequest } from '../middlewares/validation.js';
import { requireServiceKey } from '../middlewares/serviceAuth.js';

const router = Router();

router.post('/run', requireServiceKey, validateRunRequest, runCode);

export default router;
