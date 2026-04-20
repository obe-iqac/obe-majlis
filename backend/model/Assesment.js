// models/Assessment.js
import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    outcomeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Outcome",
      required: true,
    },

    marks: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

const Assessment =
  mongoose.models.Assessment || mongoose.model("Assessment", assessmentSchema);

export default Assessment;
