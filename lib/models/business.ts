import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBusiness extends Document {
  _id: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  category: string;
  description?: string;
  phone: string;
  email?: string;
  address: string;
  location?: { lat: number; lng: number };
  timezone: string;
  policies: {
    autoConfirm: boolean;
    cancelWindowHours: number;
    minLeadTimeMinutes: number;
  };
  notificationSettings: {
    emailEnabled: boolean;
    reminders: {
      enabled: boolean;
      hoursBefore: number[];
    };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema = new Schema<IBusiness>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      lat: Number,
      lng: Number,
    },
    timezone: {
      type: String,
      default: "Europe/Skopje",
    },
    policies: {
      autoConfirm: { type: Boolean, default: true },
      cancelWindowHours: { type: Number, default: 0 },
      minLeadTimeMinutes: { type: Number, default: 0 },
    },
    notificationSettings: {
      emailEnabled: { type: Boolean, default: false },
      reminders: {
        enabled: { type: Boolean, default: true },
        hoursBefore: { type: [Number], default: [24] },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

BusinessSchema.index({ slug: 1 }, { unique: true });

export const Business: Model<IBusiness> =
  mongoose.models.Business ||
  mongoose.model<IBusiness>("Business", BusinessSchema);
