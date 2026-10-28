const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  token: { type: String, required: true },
  userId: { type: String, required: true },
});

module.exports = mongoose.model("Session", sessionSchema);
