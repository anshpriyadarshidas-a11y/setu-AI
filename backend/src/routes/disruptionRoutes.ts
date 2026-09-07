import { Router } from 'express';
import { DisruptionModel } from '../models/Disruption.js';
import { RoadSegmentModel } from '../models/RoadSegment.js';

const router = Router();

// GET all disruptions
router.get('/disruptions', async (req, res) => {
    const disruptions = await DisruptionModel.find().sort({ reportedAt: -1 });
    res.json(disruptions);
});

// POST new disruption
router.post('/disruptions', async (req, res) => {
    const { segmentId, disruptionType, severity, description } = req.body;
    const disruption = await DisruptionModel.create({
        segmentId,
        disruptionType,
        severity,
        status: 'unverified'
    });
    res.status(201).json(disruption);
});

// Admin override: Simulate disruption
router.post('/disruptions/simulate', async (req, res) => {
    const { segmentId, disruptionType, severity } = req.body;
    const disruption = await DisruptionModel.create({
        segmentId,
        disruptionType,
        severity,
        status: 'active',
        reportedAt: new Date()
    });
    res.status(201).json(disruption);
});

export default router;
