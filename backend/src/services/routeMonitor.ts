import { RouteModel } from '../models/Route.js';
import { RoadSegmentModel } from '../models/RoadSegment.js';
import { WeatherDataModel } from '../models/WeatherData.js';
import { DisruptionModel } from '../models/Disruption.js';
import { computeRisk } from './riskEngine.js';
import { computeRiskDelta } from './riskDelta.js';
import { sendSMS } from './notificationService.js';
import { UserModel } from '../models/User.js';

export const monitorRoutesForAlerts = async () => {
    // 1. Get active routes
    const activeRoutes = await RouteModel.find().populate('userId');
    
    for (const route of activeRoutes) {
        const user = route.userId as any;
        if (!user || !user.smsAlertsEnabled || !user.phoneNumber) continue;

        // 2. Re-calculate current risk
        let totalRisk = 0;
        // Simplified: check segments of the route
        for (const segmentId of route.segments) {
            const segment = await RoadSegmentModel.findById(segmentId);
            const weather = await WeatherDataModel.findOne({ segmentId }).sort({ timestamp: -1 });
            const disruption = await DisruptionModel.findOne({ segmentId, status: 'active' });
            
            const risk = computeRisk(
                weather?.rainfallCurrent || 0,
                segment?.terrainScore || 0,
                0.1,
                disruption?.status || null,
                disruption?.severity || null
            );
            totalRisk += risk.riskScore;
        }

        const currentRisk = totalRisk / (route.segments.length || 1);
        
        // 3. Check for meaningful delta
        const deltaResult = computeRiskDelta(route.riskScoreAtDeparture || 0, currentRisk);
        
        if (deltaResult.alert) {
            // 4. Threshold Logic: Tier Crossing
            // Let's assume departure was 'Moderate' (0.5) and it climbed to 'High' (>0.5)
            // Existing logic uses float delta, let's keep it simple for now as requested.
            await sendSMS(user.phoneNumber, `SetuAI Alert: Risk increased on your route. Old: ${route.riskScoreAtDeparture.toFixed(2)}, New: ${currentRisk.toFixed(2)}. Check map for details.`);
        }
    }
};
