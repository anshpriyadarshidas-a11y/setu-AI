import mongoose from 'mongoose';
import { RoadSegmentModel } from '../src/models/RoadSegment.js';
import { WeatherDataModel } from '../src/models/WeatherData.js';
import { fetchWeather, parseWeather } from '../src/services/weatherService.js';
import dotenv from 'dotenv';
dotenv.config();

const ingest = async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/setuai_db');
    
    const segments = await RoadSegmentModel.find({});
    
    for (const seg of segments) {
        const [lon, lat] = seg.startPoint.coordinates;
        console.log(`Fetching weather for ${seg.name} at [${lat}, ${lon}]`);
        
        try {
            const raw = await fetchWeather(lat, lon);
            const parsed = parseWeather(raw);
            
            await WeatherDataModel.findOneAndUpdate(
                { segmentId: seg._id },
                { 
                    rainfallCurrent: parsed.rainfallCurrent,
                    forecastHourly: parsed.forecastHourly,
                    timestamp: new Date()
                },
                { upsert: true }
            );
        } catch (err) {
            console.error(`Failed to fetch weather for ${seg.name}:`, err);
        }
    }
    
    console.log('Weather ingestion complete.');
    process.exit();
};

ingest();
