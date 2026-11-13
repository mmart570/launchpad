const mongoose = require("mongoose");

// Attachment Schema: Stores metadata for files uploaded with work submissions
const attachmentSchema = new mongoose.Schema({
  originalName: { type: String, required: true }, // Original filename
  storageName: { type: String, required: true }, // Filename stored on server
  mimeType: { type: String, required: true }, // File MIME type
  size: { type: Number, required: true }, // File size in bytes
});

// Work Submission Schema: Tracks student submissions for completed work
const schema = new mongoose.Schema(
  {
    // Reference to the work order being submitted for
    workOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkOrder",
      required: true,
      index: true,
    },
    // Reference to the student submitting the work
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Submission attempt number (for resubmissions after requested changes)
    submissionNumber: { type: Number, required: true, min: 1 },
    // Student's notes/comments about the submission
    notes: { type: String, default: "" },
    // URL to the project (e.g., GitHub repo, deployed site)
    projectUrl: { type: String, default: "" },
    // Attached files with the submission
    attachments: { type: [attachmentSchema], default: [] },
    // Submission status: pending_review, changes_requested, or approved
    status: {
      type: String,
      enum: ["pending_review", "changes_requested", "approved"],
      default: "pending_review",
    },
    // Feedback from the business reviewer
    feedback: { type: String, default: "" },
    // Timestamp when the submission was reviewed
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Ensure each work order can have multiple submissions with unique submission numbers
schema.index({ workOrderId: 1, submissionNumber: 1 }, { unique: true });

module.exports = mongoose.model("WorkSubmission", schema);
