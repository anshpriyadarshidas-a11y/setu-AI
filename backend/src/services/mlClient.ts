import axios from 'axios';

export const callMlRiskService = async (payload: any) => {
  if (!process.env.ML_SERVICE_URL) return null;
  try {
    const response = await axios.post(`${process.env.ML_SERVICE_URL}/predict`, payload);
    return response.data;
  } catch (error) {
    console.error("ML Service Error:", error);
    return null;
  }
};
