import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWorkingHours extends Document {
  _id: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  createdAt: Date;
  updatedAt: Date;
}

const WorkingHoursSchema = new Schema<IWorkingHours>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
  },
  { timestamps: true }
);

WorkingHoursSchema.index({ businessId: 1, dayOfWeek: 1 });

export const WorkingHours: Model<IWorkingHours> =
  mongoose.models.WorkingHours ||
  mongoose.model<IWorkingHours>("WorkingHours", WorkingHoursSchema);
