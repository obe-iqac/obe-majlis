import express from "express";
import {
  AddCourse,
  AddProgram,
  AddTeacher,
  AssignTeacherToCourse,
  AssignTeacherToProgram,
  deleteCourse,
  deleteProgram,
  getCollegeDetailsById,
  RevokeTeacherFromCourse,
  RevokeTeacherFromProgram,
  updateCollegeAttainmentConfig,
  UpdateProgrammeOutcomes,
  updateTeacher,
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

router.delete("/delete-course/:courseId", deleteCourse);
router.delete("/delete-program/:programmeId", deleteProgram);
router.put("/revoke-teacher-course/:courseId", RevokeTeacherFromCourse);
router.put("/revoke-teacher-program/:programmeId", RevokeTeacherFromProgram);
router.put("/update-teacher/:teacherId", updateTeacher);
export default router;
