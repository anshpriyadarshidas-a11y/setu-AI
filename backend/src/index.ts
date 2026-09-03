import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import dotenv from 'dotenv';
import healthRouter from './routes/health.js';
import riskRouter from './routes/riskRoutes.js';
import routeRouter from './routes/routeRoutes.js';
import offlineRouter from './routes/offlineRoutes.js';
import disruptionRouter from './routes/disruptionRoutes.js';

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 60 });
app.use(limiter);

app.use(healthRouter);
app.use(riskRouter);
app.use(routeRouter);
app.use(offlineRouter);
app.use(disruptionRouter);

connectDB().then(() => {
    app.listen(8000, () => console.log('Server running on port 8000'));
});
