const mongoose = require("mongoose");

// Report Schema: Stores user reports about issues with work orders or other users
const reportSchema = new mongoose.Schema({
  // Reference to the work order being reported
  workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkOrder", required: true, index: true },
  // Reference to the student involved in the reported issue
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  // Category of the report: communication, payment, scope, conduct, or other
  reason: { type: String, enum: ["communication", "payment", "scope", "conduct", "other"], required: true },
  // Detailed description of the issue (10-5000 characters)
  description: { type: String, required: true, minlength: 10, maxlength: 5000 },
  // Status of the report: open, under_review, or resolved
  status: { type: String, enum: ["open", "under_review", "resolved"], default: "open" }
}, { timestamps: true });

module.exports = mongoose.model("Report", reportSchema);
