// models/Course.js
import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    year: Number,
    semester: Number,
  },
  { timestamps: true }
);

const Course =
  mongoose.models.Course || mongoose.model("Course", courseSchema);

export default Course;