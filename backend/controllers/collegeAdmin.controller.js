import mongoose from "mongoose";
import College from "../model/College.js";
import Programme from "../model/Programme.js";

export const getCollegeDetailsById = async (req, res) => {
  try {
    const college = req.college.toObject();
    const id = college._id;
    const programmes = await Programme.find({ collegeId: id }).lean();
    college.programmes = programmes;
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
    const college = req.college;
    const id = college._id;
    const { attainmentConfig, attainmentRanges, pos } = req.body;
    if (!attainmentConfig || !attainmentRanges || !pos) {
      return res.status(400).json({
        status: "error",
        message: "Attainment config, attainment ranges and pos are required",
      });
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
    const id = req.college._id;
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
    const college = req.college;
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
