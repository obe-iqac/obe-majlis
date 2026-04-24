// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    code: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
      trim: true,
    },

    password: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: ["SUPER_ADMIN", "COLLEGE_ADMIN", "HOD", "TEACHER"],
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isPasswordSet: {
      type: Boolean,
      default: false,
    },

    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      default: null,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    programmes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Programme",
      },
    ],
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
