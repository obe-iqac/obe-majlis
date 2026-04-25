// models/College.js
import mongoose from "mongoose";

const attainmentRangeSchema = new mongoose.Schema(
  {
    min: Number, // 0
    max: Number, // 50
    level: Number, // 1–5
  },
  { _id: false },
);

const attainmentConfigSchema = new mongoose.Schema(
  {
    directCOInternal: Number,
    directCOExternal: Number,
    indirectCOInternal: Number,
    indirectCOExternal: Number,
  },
  { _id: false },
);

const collegeSchema = new mongoose.Schema({
  name: String,

  AISHECode: {
    type: String,
    unique: true,
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  trialEndsAt: Date,
  subscriptionEndsAt: {
    type: Date,
    default: null,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  attainmentConfig: {
    type: attainmentConfigSchema,
    default: {},
  },

  attainmentRanges: {
    type: [attainmentRangeSchema],
    default: [],
  },
  pos: {
    type: [
      {
        id: String,
        po: String,
      },
    ],
    default: [],
  },
});

const College =
  mongoose.models.College || mongoose.model("College", collegeSchema);

export default College;
