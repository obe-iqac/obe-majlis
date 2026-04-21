import mongoose from "mongoose";
import College from "../model/College.js";
import User from "../model/user.js";

export const getAllColleges = async (req, res) => {
  try {
    const colleges = await College.find().lean();
    const users = await User.find({ role: "COLLEGE_ADMIN" }).lean();
    const collegeWithCode = colleges.map((college) => {
      const admin = users.find(
        (user) => user.collegeId?.toString() === college._id.toString(),
      );
      return {
        ...college,
        code: admin ? admin.code : null,
      };
    });

    res.json({ status: "ok", collegeWithCode });
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
      code,
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
      code: code.toUpperCase(),
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
    const { name, AISHECode, isActive, trialEndsAt, subscriptionEndsAt, code } =
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
    if (typeof code === "string") {
      const updatedUser = await User.findOneAndUpdate(
        { collegeId: id, role: "COLLEGE_ADMIN" },
        { code: code.toUpperCase() },
      );
      console.log("Updated user code:", updatedUser);
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

export const deleteCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const college = await College.findByIdAndDelete(id);
    if (!college) {
      return res
        .status(404)
        .json({ status: "error", message: "College not found" });
    }
    await User.deleteMany({ collegeId: id, role: "COLLEGE_ADMIN" });
    return res.status(200).json({ status: "ok", message: "College deleted" });
  } catch (error) {
    console.error("Error deleting college:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to delete college",
    });
  }
};
