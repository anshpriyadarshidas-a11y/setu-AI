import mongoose from 'mongoose';
import { RoadSegmentModel } from '../src/models/RoadSegment.ts';
import { VehicleModel } from '../src/models/Vehicle.ts';
import dotenv from 'dotenv';

dotenv.config();

const seed = async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/setuai_db');
    
    await RoadSegmentModel.deleteMany({});
    await RoadSegmentModel.insertMany([
        {
            segment_id: 'seg1',
            name: 'NH-27 Approach',
            startPoint: { type: 'Point', coordinates: [91.73, 26.14] },
            endPoint: { type: 'Point', coordinates: [91.89, 25.57] },
            terrainScore: 0.45
        }
    ]);
    
    await VehicleModel.deleteMany({});
    await VehicleModel.insertMany([
        { vehicleType: 'ambulance', availability: true, currentLocation: { type: 'Point', coordinates: [91.74, 26.15] } }
    ]);
    
    console.log('Database seeded.');
    process.exit();
};

seed();
