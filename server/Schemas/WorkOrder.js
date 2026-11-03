const mongoose = require("mongoose");

const workOrderSchema = mongoose.Schema(
  {
    title: {type: String, required: true, trim: true}, description: {type: String, required: true}, category: {type: String, required: true}, budget: {type: Number, required: true}, status: {type: String, enum: ["open", "in_progress", "completed", "closed"], default: "open"},
    businessId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    assignedStudentId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    deadline: {type: Date,}, 
      },
    {timestamps: true }
);

module.exports = mongoose.model("WorkOrder", workOrderSchema);