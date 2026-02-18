import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBookingAudit extends Document {
  _id: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  actorType: "BUSINESS" | "CLIENT" | "SYSTEM";
  actorId?: mongoose.Types.ObjectId; // userId if business
  action: "CREATE" | "CANCEL" | "STATUS_CHANGE" | "RESCHEDULE";
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  createdAt: Date;
}

const BookingAuditSchema = new Schema<IBookingAudit>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    actorType: {
      type: String,
      enum: ["BUSINESS", "CLIENT", "SYSTEM"],
      required: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    action: {
      type: String,
      enum: ["CREATE", "CANCEL", "STATUS_CHANGE", "RESCHEDULE"],
      required: true,
    },
    before: {
      type: Schema.Types.Mixed,
    },
    after: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

BookingAuditSchema.index({ bookingId: 1 });
BookingAuditSchema.index({ businessId: 1, createdAt: -1 });

export const BookingAudit: Model<IBookingAudit> =
  mongoose.models.BookingAudit ||
  mongoose.model<IBookingAudit>("BookingAudit", BookingAuditSchema);
