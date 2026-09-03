import mongoose, { Schema, Document, Types } from 'mongoose';

export interface Disruption extends Document {
  segmentId: Types.ObjectId;
  disruptionType: 'landslide' | 'flood' | 'blockage' | 'accident';
  severity: string;
  status: 'active' | 'cleared' | 'unverified';
  reportedAt: Date;
  verifiedAt?: Date;
}

const DisruptionSchema = new Schema({
  segmentId: { type: Schema.Types.ObjectId, ref: 'RoadSegment', required: true },
  disruptionType: { type: String, enum: ['landslide', 'flood', 'blockage', 'accident'], required: true },
  severity: String,
  status: { type: String, enum: ['active', 'cleared', 'unverified'], required: true },
  reportedAt: { type: Date, default: Date.now },
  verifiedAt: Date
});

export const DisruptionModel = mongoose.model<Disruption>('Disruption', DisruptionSchema);
