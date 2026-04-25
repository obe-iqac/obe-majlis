// middleware/collegeAccess.middleware.js
import mongoose from "mongoose";
import College from "../model/College.js";

export const validateCollegeAccess = async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId;

    if (!collegeId) {
      return res.status(403).json({
        status: "error",
        message: "Access denied: No college id found in user",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(collegeId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid college ID",
      });
    }

    const college = await College.findById(collegeId);

    if (!college) {
      return res.status(404).json({
        status: "error",
        message: "College not found",
      });
    }

    if (!college.isActive) {
      return res.status(403).json({
        status: "error",
        message: "College account inactive",
      });
    }

    const now = new Date();

    const hasValidTrial =
      college.trialEndsAt && new Date(college.trialEndsAt) > now;

    const hasValidSubscription =
      college.subscriptionEndsAt && new Date(college.subscriptionEndsAt) > now;

    if (!hasValidTrial && !hasValidSubscription) {
      return res.status(403).json({
        status: "error",
        message: "College subscription expired",
      });
    }

    req.college = college;

    next();
  } catch (err) {
    console.error("College access middleware error:", err);
    return res.status(500).json({
      status: "error",
      message: "College access validation failed",
    });
  }
};
