
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },

  passwordHash: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    required: true,
    enum: ["student", "business"],
  },

  studentProfile: {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    school: { type: String, trim: true },
    major: { type: String, trim: true },
    graduationYear: { type: Number },
    skills: [{ type: String, trim: true }],
    bio: { type: String, trim: true },
  },

  businessProfile: {
    companyName: { type: String, trim: true },
    projectLead: { type: String, trim: true },
    industry: { type: String },
    companyWebsite: { type: String },
    companyNum: { type: String },
  },
});

module.exports = mongoose.model("User", userSchema);
