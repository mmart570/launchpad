const mongoose = require("mongoose");

// User Schema: Defines the structure for both student and business users
const userSchema = new mongoose.Schema({
  // Email field - unique identifier for the user
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },

  // Password hash - bcrypt hashed password for secure storage
  passwordHash: {
    type: String,
    required: true,
  },

  // Role field - determines if user is a student or business
  role: {
    type: String,
    required: true,
    enum: ["student", "business"],
  },

  // Student profile information - null for business users
  studentProfile: {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    school: { type: String, trim: true },
    major: { type: String, trim: true },
    graduationYear: { type: Number },
    skills: [{ type: String, trim: true }],
    bio: { type: String, trim: true },
  },

  // Business profile information - null for student users
  businessProfile: {
    companyName: { type: String, trim: true },
    projectLead: { type: String, trim: true },
    industry: { type: String },
    companyWebsite: { type: String },
    companyNum: { type: String },
  },
});

module.exports = mongoose.model("User", userSchema);
