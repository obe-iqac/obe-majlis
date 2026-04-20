import express from "express";
import {
  login,
  setPassword,
  verifyCode,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/verify-code", verifyCode);
router.post("/set-password", setPassword);
router.post("/login", login);
export default router;
