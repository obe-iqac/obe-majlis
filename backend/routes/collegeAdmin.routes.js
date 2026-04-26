import express from "express";
import {
  AddProgram,
  AddTeacher,
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
router.post("/assign-teacher", AssignTeacherToProgram);
router.put("/update-pos", UpdateProgrammeOutcomes);
export default router;
