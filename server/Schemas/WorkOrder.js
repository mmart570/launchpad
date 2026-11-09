const mongoose = require("mongoose");

const workOrderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "",
    },
    budget: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["draft", "open", "in_progress", "completed", "closed"],
      default: "draft",
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deadline: {
      type: Date,
      default: null,
    },
    serviceType: {
      type: String,
      default: "",
    },
    skills: {
      type: [String],
      default: [],
    },
    estimatedHours: {
      type: Number,
      default: null,
    },
    submissionInstructions: { type: String, default: "" },
    allowEmptySubmission: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkOrder", workOrderSchema);