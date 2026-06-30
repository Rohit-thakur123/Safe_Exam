import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import compilerRouter from './routes/compiler.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { config } from './config/index.js';

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(morgan('combined'));

app.use(config.apiBasePath, compilerRouter);

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use(errorHandler);

export default app;
