import axios from 'axios';

export const getOSRMRoute = async (source: [number, number], destination: [number, number]) => {
  if (!process.env.ORS_API_KEY) {
      console.warn('ORS_API_KEY not set, using stubbed route.');
      return { distance: 1000, duration: 600 };
  }
  
  const endpoint = 'https://api.openrouteservice.org/v2/directions/driving-car';
  
  try {
    const config = {
      method: 'get',
      url: endpoint,
      params: {
          api_key: process.env.ORS_API_KEY,
          // ORS expects start/end as "lng,lat"
          start: `${source[0]},${source[1]}`, 
          end: `${destination[0]},${destination[1]}` 
      }
    };
    
    console.log('[Route Optimizer] Calling ORS with:', config.params);
    const response = await axios(config);
    
    if (!response.data.features || response.data.features.length === 0) {
        throw new Error('No routes found');
    }
    
    const route = response.data.features[0].properties.summary;
    return { distance: route.distance, duration: route.duration };
  } catch (error: any) {
    console.error('[Route Optimizer] AXIOS ERROR:', error.response?.status, error.response?.data?.error?.message || error.message);
    // Return a reasonable fallback for the hackathon demo if API fails
    return { distance: 200, duration: 18000 }; 
  }
};

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
