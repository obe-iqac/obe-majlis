import express from "express";
import {
  addCollege,
  deleteCollege,
  getAllColleges,
  updateCollege,
} from "../controllers/superAdmin.controller.js";

const router = express.Router();

router.get("/get-all-colleges", getAllColleges);
router.post("/add-college", addCollege);
router.patch("/update-college/:id", updateCollege);
router.delete("/delete-college/:id", deleteCollege);
export default router;
