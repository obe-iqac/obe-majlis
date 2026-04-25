import express from "express";
import {
  AddHOD,
  AddProgram,
  getCollegeDetailsById,
  updateCollegeAttainmentConfig,
} from "../controllers/collegeAdmin.controller.js";

const router = express.Router();

router.get("/get-full-college-info", getCollegeDetailsById);
router.post("/update-attainment-config", updateCollegeAttainmentConfig);
router.post("/add-program", AddProgram);
router.post("/add-hod", AddHOD);
export default router;
