import mongoose, { Schema, Document, Model } from "mongoose";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED_BY_CLIENT"
  | "CANCELLED_BY_BUSINESS"
  | "COMPLETED"
  | "NO_SHOW";

export interface IBooking extends Document {
  _id: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  startAt: Date; // UTC
  endAt: Date; // UTC
  status: BookingStatus;
  customer: {
    fullName: string;
    phone: string;
    email?: string;
  };
  note?: string;
  manageTokenHash?: string; // for manage booking link (Sprint 5)
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "CANCELLED_BY_CLIENT",
        "CANCELLED_BY_BUSINESS",
        "COMPLETED",
        "NO_SHOW",
      ],
      required: true,
      default: "PENDING",
    },
    customer: {
      fullName: {
        type: String,
        required: true,
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
    },
    note: {
      type: String,
      trim: true,
    },
    manageTokenHash: {
      type: String,
    },
  },
  { timestamps: true }
);

BookingSchema.index({ businessId: 1, startAt: 1 });

export const Booking: Model<IBooking> =
  mongoose.models.Booking ||
  mongoose.model<IBooking>("Booking", BookingSchema);
