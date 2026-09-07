import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.ts';
import healthRouter from './routes/health.ts';
import riskRouter from './routes/riskRoutes.ts';
import routeRouter from './routes/routeRoutes.ts';
import offlineRouter from './routes/offlineRoutes.ts';
import disruptionRouter from './routes/disruptionRoutes.ts';


dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Log incoming requests for debugging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

const limiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 60 });
app.use(limiter);

app.use('/api', healthRouter);
app.use('/api', riskRouter);
app.use('/api', routeRouter);
app.use('/api', offlineRouter);
app.use('/api', disruptionRouter);

connectDB().then(() => {
    app.listen(8000, () => console.log('Server running on port 8000'));
});
