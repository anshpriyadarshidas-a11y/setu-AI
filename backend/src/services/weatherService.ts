import axios from 'axios';

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1';

export const fetchWeather = async (lat: number, lon: number) => {
    const response = await axios.get(`${OPEN_METEO_BASE_URL}/forecast`, {
        params: {
            latitude: lat,
            longitude: lon,
            current: 'precipitation,temperature_2m,wind_speed_10m',
            hourly: 'precipitation,temperature_2m',
            forecast_days: 2,
            timezone: 'Asia/Kolkata',
        }
    });
    return response.data;
};

export const parseWeather = (data: any) => {
    const current = data.current;
    const hourly = data.hourly;
    
    const forecast = hourly.time.map((time: string, i: number) => ({
        hourOffset: i,
        rainfallForecast: hourly.precipitation[i],
        confidence: Math.max(0.3, 1.0 - (i * 0.09)) // Simple decay
    }));

    return {
        rainfallCurrent: current.precipitation,
        temperature: current.temperature_2m,
        windSpeed: current.wind_speed_10m,
        forecastHourly: forecast.slice(0, 8)
    };
};
