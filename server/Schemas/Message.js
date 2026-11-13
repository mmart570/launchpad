const mongoose = require("mongoose");

// Message Schema: Stores direct messages between business and student
const messageSchema = new mongoose.Schema({
  // Reference to the work order associated with this message thread
  workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkOrder", required: true, index: true },
  // Reference to the student involved in the conversation
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  // Reference to the user who sent this message
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // Role of the sender (student or business)
  senderRole: { type: String, enum: ["student", "business"], required: true },
  // Message body content (max 5000 characters)
  body: { type: String, required: true, maxlength: 5000 }
}, { timestamps: true });

// Index for efficient query of messages in a conversation thread
messageSchema.index({ workOrderId: 1, studentId: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
