import mongoose, { Schema, Document, Types } from 'mongoose';

export interface User extends Document {
  name: string;
  contact: string;
  phoneNumber?: string;
  smsAlertsEnabled?: boolean;
  userType: 'freight' | 'accessibility' | 'emergency';
  accessibilityRequirements: object;
}

const UserSchema = new Schema({
  name: { type: String, required: true },
  contact: String,
  phoneNumber: String,
  smsAlertsEnabled: { type: Boolean, default: false },
  userType: { type: String, enum: ['freight', 'accessibility', 'emergency'], required: true },
  accessibilityRequirements: Object
});

export const UserModel = mongoose.model<User>('User', UserSchema);
