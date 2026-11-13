const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User",required: true, },
  text: { type: String, required: true, trim: true, maxlength: 2000, },
  sentAt: { type: Date, default: Date.now,},
});

const threadSchema = new mongoose.Schema(
  {
    workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkOrder", required: true, unique: true,} , // Ensures only one conversation thread exists per work order
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, },
    messages: [messageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Thread", threadSchema);