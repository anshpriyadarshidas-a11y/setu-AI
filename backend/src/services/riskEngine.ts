export const RISK_WEIGHTS = {
  rainfall: 0.40,
  historicalClosure: 0.30,
  terrain: 0.20,
  currentStatus: 0.10,
};

export const computeRisk = (
  rainfall: number,
  terrainScore: number,
  historicalClosureRate: number,
  disruptionStatus: string | null,
  disruptionSeverity: string | null
) => {
  const rainfallRisk = Math.min(rainfall / 50, 1);
  const statusRisk = disruptionStatus === 'active' ? 1.0 : (disruptionStatus === 'unverified' ? 0.5 : 0);
  
  const score = 
    RISK_WEIGHTS.rainfall * rainfallRisk +
    RISK_WEIGHTS.historicalClosure * historicalClosureRate +
    RISK_WEIGHTS.terrain * terrainScore +
    RISK_WEIGHTS.currentStatus * statusRisk;

  return {
    riskScore: Math.min(Math.max(score, 0), 1),
    riskLevel: score > 0.75 ? 'Critical' : (score > 0.5 ? 'High' : (score > 0.25 ? 'Moderate' : 'Low')),
    contributingFactors: { rainfallRisk, terrainRisk: terrainScore, historicalClosureRisk: historicalClosureRate, statusRisk }
  };
};

export const computeForecastRisk = (
  rainfallForecast: number[],
  terrainScore: number,
  historicalClosureRate: number,
  disruptionStatus: string | null,
  disruptionSeverity: string | null
) => {
  return rainfallForecast.map((rainfall, i) => {
    const confidence = Math.max(0.3, 1.0 - (i * 0.09));
    const risk = computeRisk(rainfall, terrainScore, historicalClosureRate, disruptionStatus, disruptionSeverity);
    return {
      hourOffset: i,
      riskScore: risk.riskScore,
      riskLevel: risk.riskLevel,
      confidence: parseFloat(confidence.toFixed(3)),
      contributingFactors: risk.contributingFactors
    };
  });
};
