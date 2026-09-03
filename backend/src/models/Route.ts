import mongoose, { Schema, Document, Types } from 'mongoose';

export interface Route extends Document {
  userId?: Types.ObjectId;
  source: { type: string, coordinates: [number, number] };
  destination: { type: string, coordinates: [number, number] };
  mode: 'freight' | 'accessibility' | 'emergency';
  distance: number;
  estimatedTime: number;
  riskScoreAtDeparture: number;
  segments: Types.ObjectId[];
  createdAt: Date;
}

const RouteSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  source: { type: { type: String, default: 'Point' }, coordinates: [Number] },
  destination: { type: { type: String, default: 'Point' }, coordinates: [Number] },
  mode: { type: String, enum: ['freight', 'accessibility', 'emergency'], required: true },
  distance: Number,
  estimatedTime: Number,
  riskScoreAtDeparture: Number,
  segments: [{ type: Schema.Types.ObjectId, ref: 'RoadSegment' }],
  createdAt: { type: Date, default: Date.now }
});

RouteSchema.index({ source: '2dsphere', destination: '2dsphere' });

export const RouteModel = mongoose.model<Route>('Route', RouteSchema);
