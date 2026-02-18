import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClosure extends Document {
  _id: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  type: "BREAK" | "HOLIDAY";
  date: string; // "YYYY-MM-DD"
  startTime?: string; // "HH:mm" (for BREAK)
  endTime?: string; // "HH:mm" (for BREAK)
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClosureSchema = new Schema<IClosure>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    type: {
      type: String,
      enum: ["BREAK", "HOLIDAY"],
      required: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    startTime: {
      type: String,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    endTime: {
      type: String,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

ClosureSchema.index({ businessId: 1, date: 1 });

export const Closure: Model<IClosure> =
  mongoose.models.Closure ||
  mongoose.model<IClosure>("Closure", ClosureSchema);
