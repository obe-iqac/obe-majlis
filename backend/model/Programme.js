// models/Programme.js
import mongoose from "mongoose";

const programmeSchema = new mongoose.Schema({
  name: String,

  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College",
    required: true,
  },
});

export default mongoose.models.Programme ||
  mongoose.model("Programme", programmeSchema);
