import { computeRisk } from '../src/services/riskEngine.js';

describe('Risk Engine', () => {
    test('computes correct risk score', () => {
        const result = computeRisk(10, 0.5, 0.1, null, null);
        expect(result.riskScore).toBeGreaterThan(0);
        expect(result.riskScore).toBeLessThan(1);
    });
});
