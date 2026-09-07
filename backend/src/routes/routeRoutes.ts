import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { RouteModel } from '../models/Route.js';
import { RoadSegmentModel } from '../models/RoadSegment.js';
import { WeatherDataModel } from '../models/WeatherData.js';
import { DisruptionModel } from '../models/Disruption.js';
import { getOSRMRoute, computeRouteCost } from '../services/routeOptimizer.js';
import { computeRiskDelta } from '../services/riskDelta.js';
import { computeRisk } from '../services/riskEngine.js';

const router = Router();

router.post('/routes', [
    body('source.coordinates').isArray({ min: 2, max: 2 }),
    body('destination.coordinates').isArray({ min: 2, max: 2 }),
    body('mode').isIn(['freight', 'accessibility', 'emergency']),
], async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { source, destination, mode, userId, accessibilityRequirements, cargoPerishable } = req.body;
    
    const osrmRoute = await getOSRMRoute(source.coordinates, destination.coordinates);
    
    const riskScore = 0.35; 
    
    const cost = computeRouteCost(
        osrmRoute.distance, 
        osrmRoute.duration, 
        riskScore, 
        mode,
        { 
            wheelchair: accessibilityRequirements?.wheelchair,
            steep: accessibilityRequirements?.avoidSteep,
            perishable: cargoPerishable
        }
    );
    
    const route = await RouteModel.create({
        userId,
        source: { type: 'Point', coordinates: source.coordinates },
        destination: { type: 'Point', coordinates: destination.coordinates },
        mode,
        distance: osrmRoute.distance,
        estimatedTime: osrmRoute.duration,
        riskScoreAtDeparture: riskScore
    });

    res.json({ recommended: route, cost });
});

router.get('/routes/:routeId/risk-delta', async (req, res) => {
    const route = await RouteModel.findOne({ _id: req.params.routeId }).populate('segments');
    if (!route) return res.status(404).json({ error: 'Route not found' });
    
    let totalRisk = 0;
    for (const segment of route.segments as any) {
        const weather = await WeatherDataModel.findOne({ segmentId: segment._id }).sort({ timestamp: -1 });
        const disruption = await DisruptionModel.findOne({ segmentId: segment._id, status: { $in: ['active', 'unverified'] } });
        
        const risk = computeRisk(
            weather?.rainfallCurrent || 0,
            segment.terrainScore,
            0.1,
            disruption?.status || null,
            disruption?.severity || null
        );
        totalRisk += risk.riskScore;
    }

    const latestRiskScore = totalRisk / (route.segments.length || 1);
    
    const delta = computeRiskDelta(route.riskScoreAtDeparture || 0, latestRiskScore);
    res.json({ routeId: route._id, ...delta, latestRiskScore });
});

export default router;
