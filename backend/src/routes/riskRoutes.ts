import { Router } from 'express';
import { RoadSegmentModel } from '../models/RoadSegment.js';
import { WeatherDataModel } from '../models/WeatherData.js';
import { DisruptionModel } from '../models/Disruption.js';
import { computeRisk, computeForecastRisk } from '../services/riskEngine.js';
import { RiskScoreModel } from '../models/RiskScore.js';

const router = Router();

router.get('/risk/:segmentId', async (req, res) => {
    const segment = await RoadSegmentModel.findOne({ segment_id: req.params.segmentId });
    if (!segment) return res.status(404).json({ error: 'Segment not found' });

    const weather = await WeatherDataModel.findOne({ segmentId: segment._id }).sort({ timestamp: -1 });
    const disruption = await DisruptionModel.findOne({ segmentId: segment._id, status: { $in: ['active', 'unverified'] } });

    const result = computeRisk(
        weather?.rainfallCurrent || 0,
        segment.terrainScore,
        0.1,
        disruption?.status || null,
        disruption?.severity || null
    );

    await RiskScoreModel.create({
        segmentId: segment._id,
        computedForHour: new Date(),
        ...result
    });

    res.json(result);
});

router.get('/risk/:segmentId/forecast', async (req, res) => {
    const segment = await RoadSegmentModel.findOne({ segment_id: req.params.segmentId });
    if (!segment) return res.status(404).json({ error: 'Segment not found' });

    const weather = await WeatherDataModel.findOne({ segmentId: segment._id }).sort({ timestamp: -1 });
    const disruption = await DisruptionModel.findOne({ segmentId: segment._id, status: { $in: ['active', 'unverified'] } });
    
    const forecasts = weather?.forecastHourly.map(f => f.rainfallForecast) || [10];

    const result = computeForecastRisk(
        forecasts,
        segment.terrainScore,
        0.1,
        disruption?.status || null,
        disruption?.severity || null
    );

    res.json({ segmentId: segment._id, forecast: result });
});

export default router;
