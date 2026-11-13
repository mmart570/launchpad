const mongoose = require("mongoose");

// Session Schema: Stores authentication tokens and session information
const sessionSchema = new mongoose.Schema({
  // Unique authentication token (JWT or similar)
  token: {
    type: String,
    required: true,
    unique: true,
  },

  // Reference to the authenticated user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Session expiration timestamp (default: 7 days from creation)
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
});

// TTL index: automatically delete expired sessions from MongoDB
sessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

module.exports = mongoose.model("Session", sessionSchema);