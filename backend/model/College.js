// models/College.js
import mongoose from "mongoose";

const collegeSchema = new mongoose.Schema({
  name: String,

  AISHECode: {
    type: String,
    unique: true,
  },

  // 🔥 Manual control
  isActive: {
    type: Boolean,
    default: true,
  },

  // 🔥 Trial / subscription
  trialEndsAt: {
    type: Date,
  },

  subscriptionEndsAt: {
    type: Date,
    default: null,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});
const College =
  mongoose.models.College || mongoose.model("College", collegeSchema);

export default College;
