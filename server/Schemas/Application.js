const mongoose = require("mongoose");

// Application Schema: Stores student applications to work orders
const applicationSchema = new mongoose.Schema(
  {
    // Reference to the work order being applied for
    workOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkOrder",
      required: true,
    },

    // Reference to the student submitting the application
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Student's application message/cover letter
    message: {
      type: String,
      trim: true,
      required: true,
    },

    // Application status: pending (awaiting review), accepted, or rejected
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true, // Automatically tracks createdAt and updatedAt
  },
);

// Ensure a student can only apply once to the same work order
applicationSchema.index({ workOrderId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
