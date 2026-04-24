import express from "express";
import { getCollegeDetailsById } from "../controllers/college.controller.js";

const router = express.Router();

router.get("/get-college-info", getCollegeDetailsById);

export default router;
