import request from 'supertest';
import express from 'express';
import healthRouter from '../src/routes/health.js';

const app = express();
app.use(healthRouter);

describe('GET /health', () => {
  it('should return status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('ok');
  });
});
