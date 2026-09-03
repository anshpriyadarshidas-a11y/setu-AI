export const MODES = {
  freight: { alpha: 0.7, beta: 0.2 },
  accessibility: { alpha: 0.4, beta: 0.8 },
  emergency: { alpha: 0.5, beta: 0.3 }
};

export const computeRouteCost = (
  distance: number,
  duration: number,
  riskScore: number,
  mode: 'freight' | 'accessibility' | 'emergency',
  constraints: any = {}
) => {
  const { alpha, beta } = MODES[mode] || MODES.emergency;
  
  // Base cost is time
  let cost = duration / 3600;
  
  // Add risk penalty
  cost += riskScore * 2 * alpha;
  
  // Add constraint penalty (mock implementation)
  if (mode === 'accessibility' && constraints.wheelchair && constraints.steep) {
      cost += 0.5 * beta;
  }
  if (mode === 'freight' && constraints.perishable) {
      cost *= 1.2; // Spoilage multiplier
  }
  
  return cost;
};
