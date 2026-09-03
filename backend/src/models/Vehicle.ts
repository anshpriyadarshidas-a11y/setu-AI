import mongoose, { Schema, Document } from 'mongoose';

export interface Vehicle extends Document {
  vehicleType: string;
  accessibilityFeatures: object;
  availability: boolean;
  currentLocation: { type: string, coordinates: [number, number] };
}

const VehicleSchema = new Schema({
  vehicleType: String,
  accessibilityFeatures: Object,
  availability: Boolean,
  currentLocation: { type: { type: String, default: 'Point' }, coordinates: [Number] }
});

VehicleSchema.index({ currentLocation: '2dsphere' });

export const VehicleModel = mongoose.model<Vehicle>('Vehicle', VehicleSchema);
