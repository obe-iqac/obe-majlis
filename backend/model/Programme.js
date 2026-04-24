// models/Programme.js
import mongoose from "mongoose";

const programmeSchema = new mongoose.Schema({
  name: String,

  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College",
    required: true,
  },

  hodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
});

export default mongoose.models.Programme ||
  mongoose.model("Programme", programmeSchema);
