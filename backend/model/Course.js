// models/Course.js
import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    programmeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Programme",
      required: true,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true,
    },

    semester: Number,
  },
  { timestamps: true },
);

const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);

export default Course;
