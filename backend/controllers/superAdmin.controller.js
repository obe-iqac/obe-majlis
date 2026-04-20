import mongoose from "mongoose";
import College from "../model/College.js";
import User from "../model/user.js";

export const getAllColleges = async (req, res) => {
  try {
    const colleges = await College.find().lean(); // Assuming College is a Mongoose model
    res.json({ status: "ok", colleges });
  } catch (error) {
    console.error("Error fetching colleges:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch colleges" });
  }
};

const parseDateOrNull = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const addCollege = async (req, res) => {
  // const session = await mongoose.startSession();
  // session.startTransaction();
  try {
    const {
      name,
      AISHECode,
      loginCode,
      isActive = true,
      trialEndsAt = null,
      subscriptionEndsAt = null,
    } = req.body;

    if (!name?.trim() || !AISHECode?.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Name and AISHE code are required",
      });
    }

    const normalizedAISHECode = AISHECode.trim().toUpperCase();
    const existingCollege = await College.findOne({
      AISHECode: normalizedAISHECode,
    }).lean();
    // .session(session)

    if (existingCollege) {
      return res.status(409).json({
        status: "error",
        message: "College with this AISHE code already exists",
      });
    }

    const college = await College.create({
      name: name.trim(),
      AISHECode: normalizedAISHECode,
      isActive: Boolean(isActive),
      trialEndsAt: parseDateOrNull(trialEndsAt),
      subscriptionEndsAt: parseDateOrNull(subscriptionEndsAt),
      createdBy: req.user?._id || null,
    });
    // .session(session);
    const user = await User.create({
      name,
      code: loginCode.toUpperCase(),
      password: null,
      role: "COLLEGE_ADMIN",
      isActive: Boolean(isActive),
      isPasswordSet: false,
      collegeId: college._id,
    });
    // .session(session);

    // await session.commitTransaction();
    return res.status(201).json({ status: "ok", college });
  } catch (error) {
    // await session.abortTransaction();
    console.error("Error adding college:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to add college",
    });
  }
};

export const updateCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, AISHECode, isActive, trialEndsAt, subscriptionEndsAt } =
      req.body;

    const updates = {};

    if (typeof name === "string") {
      updates.name = name.trim();
    }

    if (typeof AISHECode === "string") {
      updates.AISHECode = AISHECode.trim().toUpperCase();
    }

    if (typeof isActive === "boolean") {
      updates.isActive = isActive;
    }

    if (trialEndsAt !== undefined) {
      updates.trialEndsAt = parseDateOrNull(trialEndsAt);
    }

    if (subscriptionEndsAt !== undefined) {
      updates.subscriptionEndsAt = parseDateOrNull(subscriptionEndsAt);
    }

    const college = await College.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!college) {
      return res
        .status(404)
        .json({ status: "error", message: "College not found" });
    }

    return res.status(200).json({ status: "ok", college });
  } catch (error) {
    console.error("Error updating college:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to update college",
    });
  }
};
