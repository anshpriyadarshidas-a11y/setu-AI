import mongoose, { Schema, Document } from 'mongoose';

export interface RoadSegment extends Document {
  segment_id: string;
  name?: string;
  startPoint: { type: string, coordinates: [number, number] };
  endPoint: { type: string, coordinates: [number, number] };
  roadType?: string;
  terrainScore: number;
  accessibilityInfo?: object;
  floodProne: boolean;
}

const RoadSegmentSchema = new Schema({
  segment_id: { type: String, required: true, unique: true },
  name: String,
  startPoint: { type: { type: String, default: 'Point' }, coordinates: [Number] },
  endPoint: { type: { type: String, default: 'Point' }, coordinates: [Number] },
  roadType: String,
  terrainScore: { type: Number, default: 0 },
  accessibilityInfo: Object,
  floodProne: { type: Boolean, default: false }
});

RoadSegmentSchema.index({ startPoint: '2dsphere', endPoint: '2dsphere' });

export const RoadSegmentModel = mongoose.model<RoadSegment>('RoadSegment', RoadSegmentSchema);
