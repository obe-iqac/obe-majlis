import mongoose from "mongoose";
import College from "../model/College.js";
import Programme from "../model/Programme.js";

export const getCollegeDetailsById = async (req, res) => {
  try {
    const id = req.user?.collegeId;
    if (!id) {
      return res.status(400).json({
        status: "error",
        message: "College ID not found in user",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid college ID",
      });
    }
    const college = await College.findById(id).lean();
    const programmes = await Programme.find({ collegeId: id }).lean();
    college.programmes = programmes;
    if (!college) {
      return res
        .status(404)
        .json({ status: "error", message: "College not found" });
    }
    if (!college.isActive) {
      return res
        .status(403)
        .json({ status: "error", message: "College is not active" });
    }
    const now = new Date();

    const hasValidTrial = !!college.trialEndsAt && college.trialEndsAt > now;

    const hasValidSubscription =
      !!college.subscriptionEndsAt && college.subscriptionEndsAt > now;

    if (!hasValidTrial && !hasValidSubscription) {
      return res.status(403).json({
        status: "error",
        message: "College subscription is not valid",
      });
    }

    res.status(200).json({ status: "ok", college });
  } catch (error) {
    console.error("Error fetching colleges:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch colleges" });
  }
};

export const updateCollegeAttainmentConfig = async (req, res) => {
  try {
    const id = req.user?.collegeId;
    if (!id) {
      return res.status(400).json({
        status: "error",
        message: "College ID not found in user",
      });
    }
    const { attainmentConfig, attainmentRanges, pos } = req.body;
    if (!attainmentConfig || !attainmentRanges || !pos) {
      return res.status(400).json({
        status: "error",
        message: "Either Attainment config or Attainment range is required",
      });
    }
    const college = await College.findById(id);
    if (!college) {
      return res
        .status(404)
        .json({ status: "error", message: "College not found" });
    }
    college.attainmentConfig = attainmentConfig;
    college.attainmentRanges = attainmentRanges;
    college.pos = pos;
    await college.save();
    res
      .status(200)
      .json({ status: "ok", message: "Attainment config updated" });
  } catch (error) {
    console.error("Error updating attainment config:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to update attainment config" });
  }
};

export const AddProgram = async (req, res) => {
  try {
    const id = req.user?.collegeId;
    if (!id) {
      return res.status(400).json({
        status: "error",
        message: "College ID not found in user",
      });
    }
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({
        status: "error",
        message: "Program name is required",
      });
    }
    const college = await College.findById(id).lean();
    if (!college) {
      return res
        .status(404)
        .json({ status: "error", message: "College not found" });
    }
    const newProgramme = await Programme.create({ name, collegeId: id });

    res.status(200).json({
      status: "ok",
      message: "Programe added",
      programme: newProgramme,
    });
  } catch (error) {
    console.error("Error adding programme:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to add programme" });
  }
};
