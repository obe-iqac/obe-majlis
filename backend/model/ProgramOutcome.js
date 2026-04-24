// models/ProgramOutcome.js
import mongoose from "mongoose";

const poSchema = new mongoose.Schema({
  label: String,
  description: String,

  programmeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Programme",
    required: true,
  },
});

export default mongoose.models.ProgramOutcome ||
  mongoose.model("ProgramOutcome", poSchema);
