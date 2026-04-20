import express from "express";
import {
  login,
  setPassword,
  verifyAuthToken,
  verifyCode,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/verify-code", verifyCode);
router.post("/set-password", setPassword);
router.post("/login", login);
router.post("/verify-token", verifyAuthToken);
export default router;
