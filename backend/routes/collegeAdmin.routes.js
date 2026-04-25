import express from "express";
import {
  getCollegeDetailsById,
  updateCollegeAttainmentConfig,
} from "../controllers/college.controller.js";

const router = express.Router();

router.get("/get-college-info", getCollegeDetailsById);
router.post("/update-attainment-config", updateCollegeAttainmentConfig);
export default router;
