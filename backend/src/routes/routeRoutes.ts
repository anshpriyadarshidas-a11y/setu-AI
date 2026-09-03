import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { RouteModel } from '../models/Route.js';
import { getOSRMRoute, computeRouteCost } from '../services/routeOptimizer.js';
import { computeRiskDelta } from '../services/riskDelta.js';

const router = Router();

router.post('/api/routes', [
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

router.get('/api/routes/:routeId/risk-delta', async (req, res) => {
    const route = await RouteModel.findOne({ _id: req.params.routeId });
    if (!route) return res.status(404).json({ error: 'Route not found' });
    
    const latestRiskScore = 0.45; 
    
    const delta = computeRiskDelta(route.riskScoreAtDeparture || 0, latestRiskScore);
    res.json({ routeId: route._id, ...delta });
});

export default router;
