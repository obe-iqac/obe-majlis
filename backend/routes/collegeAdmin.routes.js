import express from "express";
import {
  AddCourse,
  AddProgram,
  AddTeacher,
  AssignTeacherToCourse,
  AssignTeacherToProgram,
  getCollegeDetailsById,
  updateCollegeAttainmentConfig,
  UpdateProgrammeOutcomes,
} from "../controllers/collegeAdmin.controller.js";

const router = express.Router();

router.get("/get-full-college-info", getCollegeDetailsById);
router.post("/update-attainment-config", updateCollegeAttainmentConfig);
router.post("/add-program", AddProgram);
router.post("/add-teacher", AddTeacher);
router.post("/assign-teacher-program", AssignTeacherToProgram);
router.post("/assign-teacher-course", AssignTeacherToCourse);
router.put("/update-pos", UpdateProgrammeOutcomes);
router.post("/add-course", AddCourse);
export default router;
