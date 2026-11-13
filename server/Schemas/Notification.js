const mongoose = require("mongoose");

// Notification Schema: Stores in-app notifications for users
const notificationSchema = new mongoose.Schema({
  // User who receives this notification
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  // Type of notification (e.g., "application_received", "work_assigned", "submission_reviewed")
  type: { type: String, required: true },
  // Notification title/heading
  title: { type: String, required: true },
  // Detailed notification message
  message: { type: String, required: true },
  // URL link to the relevant resource
  link: { type: String, required: true },
  // Unique key to prevent duplicate notifications for the same event
  eventKey: { type: String, required: true, unique: true },
  // Whether the notification has been read by the user
  read: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// Composite index for efficient retrieval of user's notifications sorted by time
notificationSchema.index({ recipientId: 1, createdAt: -1 });

module.exports = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
