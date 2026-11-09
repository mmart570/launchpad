const mongoose = require("mongoose");
const attachmentSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  storageName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
});
const schema = new mongoose.Schema({
  workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkOrder", required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  submissionNumber: { type: Number, required: true, min: 1 },
  notes: { type: String, default: "" },
  projectUrl: { type: String, default: "" },
  attachments: { type: [attachmentSchema], default: [] },
  status: { type: String, enum: ["pending_review", "changes_requested", "approved"], default: "pending_review" },
  feedback: { type: String, default: "" },
  reviewedAt: { type: Date, default: null },
}, { timestamps: true });
schema.index({ workOrderId: 1, submissionNumber: 1 }, { unique: true });
module.exports = mongoose.model("WorkSubmission", schema);
