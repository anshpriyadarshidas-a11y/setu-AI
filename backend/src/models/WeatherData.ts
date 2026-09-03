import mongoose, { Schema, Document, Types } from 'mongoose';

export interface WeatherData extends Document {
  segmentId: Types.ObjectId;
  rainfallCurrent: number;
  forecastHourly: { hourOffset: number, rainfallForecast: number, confidence: number }[];
  timestamp: Date;
}

const WeatherDataSchema = new Schema({
  segmentId: { type: Schema.Types.ObjectId, ref: 'RoadSegment', required: true },
  rainfallCurrent: { type: Number, default: 0 },
  forecastHourly: [{ hourOffset: Number, rainfallForecast: Number, confidence: Number }],
  timestamp: { type: Date, default: Date.now }
});

export const WeatherDataModel = mongoose.model<WeatherData>('WeatherData', WeatherDataSchema);
