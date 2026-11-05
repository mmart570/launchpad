const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    workOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkOrder",
      required: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      trim: true,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

// A student can apply only once to the same work order.
applicationSchema.index(
  { workOrderId: 1, studentId: 1 },
  { unique: true },
);

module.exports = mongoose.model("Application", applicationSchema);
