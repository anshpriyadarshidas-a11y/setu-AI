import mongoose, { Schema, Document, Types } from 'mongoose';

export interface RiskScore extends Document {
  segmentId: Types.ObjectId;
  computedForHour: Date;
  riskScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  confidence: number;
  contributingFactors: object;
  computedAt: Date;
}

const RiskScoreSchema = new Schema({
  segmentId: { type: Schema.Types.ObjectId, ref: 'RoadSegment', required: true },
  computedForHour: { type: Date, required: true },
  riskScore: Number,
  riskLevel: { type: String, enum: ['Low', 'Moderate', 'High', 'Critical'], required: true },
  confidence: Number,
  contributingFactors: Object,
  computedAt: { type: Date, default: Date.now }
});

RiskScoreSchema.index({ segmentId: 1, computedForHour: 1 });

export const RiskScoreModel = mongoose.model<RiskScore>('RiskScore', RiskScoreSchema);
