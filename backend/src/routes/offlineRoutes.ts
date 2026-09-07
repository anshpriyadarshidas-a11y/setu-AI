import { Router } from 'express';
import { RouteModel } from '../models/Route.js';
import { RiskScoreModel } from '../models/RiskScore.js';
import { WeatherDataModel } from '../models/WeatherData.js';

const router = Router();

router.get('/offline/package', async (req, res) => {
    const { routeId } = req.query;
    
    // 1. Fetch route
    const route = await RouteModel.findOne({ _id: routeId });
    if (!route) return res.status(404).json({ error: 'Route not found' });
    
    // 2. Aggregate predictive risk forecasts for the route segments (mocked for demo)
    const segments = route.segments;
    const forecasts = [];
    
    for (const segmentId of segments) {
        const weather = await WeatherDataModel.findOne({ segmentId }).sort({ timestamp: -1 });
        forecasts.push({
            segmentId,
            forecast: weather?.forecastHourly || []
        });
    }
    
    // 3. Return payload
    res.json({
        route,
        segmentForecasts: forecasts,
        generatedAt: new Date()
    });
});

export default router;
