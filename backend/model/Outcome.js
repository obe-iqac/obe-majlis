// models/Outcome.js
import mongoose from "mongoose";

const outcomeSchema = new mongoose.Schema(
  {
    code: {
      type: String, // CO1, CO2
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
  },
  { timestamps: true }
);

const Outcome =
  mongoose.models.Outcome || mongoose.model("Outcome", outcomeSchema);

export default Outcome;