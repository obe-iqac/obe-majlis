import express from "express";
import {
  addCollege,
  getAllColleges,
  updateCollege,
} from "../controllers/superAdmin.controller.js";

const router = express.Router();

router.get("/get-all-colleges", getAllColleges);
router.post("/add-college", addCollege);
router.patch("/update-college/:id", updateCollege);
export default router;
