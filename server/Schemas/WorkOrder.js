const mongoose = require("mongoose");

// Work Order Schema: Represents job postings created by businesses for students
const workOrderSchema = new mongoose.Schema(
  {
    // Title of the work order
    title: {
      type: String,
      trim: true,
      default: "",
    },
    // Detailed description of the work to be done
    description: {
      type: String,
      default: "",
    },
    // Category/type of work (e.g., design, development, writing)
    category: {
      type: String,
      trim: true,
      default: "",
    },
    // Budget amount for the work
    budget: {
      type: Number,
      default: null,
    },
    // Status of the work order through its lifecycle
    status: {
      type: String,
      enum: ["draft", "open", "in_progress", "completed", "closed"],
      default: "draft",
    },
    // Business user who created this work order
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Student assigned to complete this work order (when accepted)
    assignedStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Deadline for completing the work
    deadline: {
      type: Date,
      default: null,
    },
    // Type of service requested
    serviceType: {
      type: String,
      default: "",
    },
    // Required skills for the work
    skills: {
      type: [String],
      default: [],
    },
    // Estimated hours to complete the work
    estimatedHours: {
      type: Number,
      default: null,
    },
    // Instructions for submitting the completed work
    submissionInstructions: { type: String, default: "" },
    // Whether students can submit without any files
    allowEmptySubmission: { type: Boolean, default: false },
  },
  { timestamps: true }, // Automatically tracks createdAt and updatedAt
);

module.exports = mongoose.model("WorkOrder", workOrderSchema);
