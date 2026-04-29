import mongoose from "mongoose";
import College from "../model/College.js";
import Programme from "../model/Programme.js";
import User from "../model/User.js";

import bcrypt from "bcrypt";
import Course from "../model/Course.js";

export const getCollegeDetailsById = async (req, res) => {
  try {
    const college = req.college.toObject();
    const id = college._id;
    const programmes = await Programme.find({ collegeId: id }).lean();
    const teachers = await User.find({
      collegeId: id,
      role: { $in: ["HOD", "TEACHER"] },
    })
      .select("name role isActive programmes courses code")
      .lean();
    const courses = await Course.find({ collegeId: id })
      .populate("programmeId", "name")
      .lean();
    const data = {
      programmes,
      teachers,
      college,
      courses,
    };
    res.status(200).json({ status: "ok", data });
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

export const AddTeacher = async (req, res) => {
  try {
    const id = req.college._id;
    if (!id) {
      return res.status(400).json({
        status: "error",
        message: "College ID not found in user",
      });
    }
    const { name, code, password, role } = req.body;
    if (!name || !code || !role) {
      return res.status(400).json({
        status: "error",
        message: "Name ,role and login code is required",
      });
    }
    const college = req.college;
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;
    console.log(
      password
        ? "Password provided, hashing..."
        : "No password provided, skipping hashing.",
    );
    const newHod = await User.create({
      name,
      code: code.toUpperCase().trim(),
      password: passwordHash,
      role: role.toUpperCase(),
      isActive: true,
      isPasswordSet: password ? true : false,
      collegeId: id,
      createdBy: req.user._id,
    });
    const safeUser = {
      _id: newHod._id,
      name: newHod.name,
      code: newHod.code,
      role: newHod.role,
      programmes: newHod.programmes,
      courses: newHod.courses,
      isActive: newHod.isActive,
      isPasswordSet: newHod.isPasswordSet,
    };
    res.status(200).json({
      status: "ok",
      message: "User added",
      user: safeUser,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to add programme" });
  }
};

export const AssignTeacherToProgram = async (req, res) => {
  try {
    const collegeId = req.college._id;
    const { teacherId, programmeId } = req.body;
    if (!teacherId || !programmeId) {
      return res.status(400).json({
        status: "error",
        message: "Teacher ID and Programme ID are required",
      });
    }
    const teacher = await User.findOne({
      _id: teacherId,
      collegeId,
      role: "HOD",
    });
    if (!teacher) {
      return res.status(404).json({
        status: "error",
        message: "Teacher not found in this college",
      });
    }
    const programme = await Programme.findOne({
      _id: programmeId,
      collegeId,
    });
    if (!programme) {
      return res.status(404).json({
        status: "error",
        message: "Programme not found in this college",
      });
    }
    if (teacher.programmes.includes(programmeId)) {
      return res.status(400).json({
        status: "error",
        message: "Teacher is already assigned to this programme",
      });
    }
    teacher.programmes.push(programmeId);
    await teacher.save();
    res.status(200).json({
      status: "ok",
      message: "Teacher assigned to programme",
    });
  } catch (error) {
    console.error("Error assigning teacher to programme:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to assign teacher to programme",
    });
  }
};
export const AssignTeacherToCourse = async (req, res) => {
  try {
    const collegeId = req.college._id;
    const { teacherId, courseId } = req.body;
    if (!teacherId || !courseId) {
      return res.status(400).json({
        status: "error",
        message: "Teacher ID and Course ID are required",
      });
    }
    const teacher = await User.findOne({
      _id: teacherId,
      collegeId,
      role: { $in: ["HOD", "TEACHER"] },
    });
    if (!teacher) {
      return res.status(404).json({
        status: "error",
        message: "Teacher not found in this college",
      });
    }
    const course = await Course.findOne({
      _id: courseId,
      collegeId,
    });
    if (!course) {
      return res.status(404).json({
        status: "error",
        message: "Course not found in this college",
      });
    }
    if (teacher.courses.includes(courseId)) {
      return res.status(400).json({
        status: "error",
        message: "Teacher is already assigned to this course",
      });
    }
    teacher.courses.push(courseId);
    await teacher.save();
    res.status(200).json({
      status: "ok",
      message: "Teacher assigned to course",
    });
  } catch (error) {
    console.error("Error assigning teacher to course:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to assign teacher to course",
    });
  }
};

export const UpdateProgrammeOutcomes = async (req, res) => {
  try {
    const collegeId = req.college._id;
    const { pos } = req.body;
    if (!pos || !Array.isArray(pos)) {
      return res.status(400).json({
        status: "error",
        message: "POs are required",
      });
    }
    req.college.pos = pos;
    await req.college.save();
    res.status(200).json({
      status: "ok",
      message: "Programme outcomes updated",
    });
  } catch (error) {
    console.error("Error updating programme outcomes:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update programme outcomes",
    });
  }
};

export const AddCourse = async (req, res) => {
  try {
    const collegeId = req.college._id;
    const { name, programmeId, semester } = req.body;
    if (!name || !programmeId || !semester) {
      return res.status(400).json({
        status: "error",
        message: "Name, programme ID and semester are required",
      });
    }
    const programme = await Programme.findOne({
      _id: programmeId,
      collegeId,
    });
    if (!programme) {
      return res.status(404).json({
        status: "error",
        message: "Programme not found in this college",
      });
    }
    const newCourse = await Course.create({
      name,
      programmeId,
      semester,
      collegeId,
    });
    res.status(200).json({
      status: "ok",
      message: "Course added",
      course: newCourse,
    });
  } catch (error) {
    console.error("Error adding course:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to add course",
    });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const collegeId = req.college._id;
    const { courseId } = req.params;
    if (!courseId) {
      return res.status(400).json({
        status: "error",
        message: "Course ID is required",
      });
    }
    const course = await Course.findOneAndDelete({
      _id: courseId,
      collegeId,
    });
    if (!course) {
      return res.status(404).json({
        status: "error",
        message: "Course not found in this college",
      });
    }
    await User.updateMany(
      { collegeId, courses: courseId },
      { $pull: { courses: courseId } },
    );
    res.status(200).json({
      status: "ok",
      message: "Course deleted",
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete course",
    });
  }
};

export const deleteProgram = async (req, res) => {
  try {
    const collegeId = req.college._id;
    const { programmeId } = req.params;
    if (!programmeId) {
      return res.status(400).json({
        status: "error",
        message: "Programme ID is required",
      });
    }
    const programme = await Programme.findOneAndDelete({
      _id: programmeId,
      collegeId,
    });
    if (!programme) {
      return res.status(404).json({
        status: "error",
        message: "Programme not found in this college",
      });
    }
    await User.updateMany(
      { collegeId, programmes: programmeId },
      { $pull: { programmes: programmeId } },
    );
    res.status(200).json({
      status: "ok",
      message: "Program deleted",
    });
  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete program",
    });
  }
};

export const RevokeTeacherFromCourse = async (req, res) => {
  try {
    const collegeId = req.college._id;
    const { teacherId } = req.body;
    const { courseId } = req.params;
    if (!teacherId || !courseId) {
      return res.status(400).json({
        status: "error",
        message: "Teacher ID and Course ID are required",
      });
    }
    const teacher = await User.findOne({
      _id: teacherId,
      collegeId,
      role: { $in: ["HOD", "TEACHER"] },
    });
    if (!teacher) {
      return res.status(404).json({
        status: "error",
        message: "Teacher not found in this college",
      });
    }
    const course = await Course.findOne({
      _id: courseId,
      collegeId,
    });
    if (!course) {
      return res.status(404).json({
        status: "error",
        message: "Course not found in this college",
      });
    }
    if (!teacher.courses.includes(courseId)) {
      return res.status(400).json({
        status: "error",
        message: "Teacher is not assigned to this course",
      });
    }
    teacher.courses.pull(courseId);
    await teacher.save();
    res.status(200).json({
      status: "ok",
      message: "Teacher revoked froms course",
    });
  } catch (error) {
    console.error("Error revoking teacher from course:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to revoke teacher from course",
    });
  }
};

export const RevokeTeacherFromProgram = async (req, res) => {
  try {
    const collegeId = req.college._id;
    const { teacherId } = req.body;
    const { programmeId } = req.params;
    if (!teacherId || !programmeId) {
      return res.status(400).json({
        status: "error",
        message: "Teacher ID and Programme ID are required",
      });
    }
    const teacher = await User.findOne({
      _id: teacherId,
      collegeId,
      role: "HOD",
    });
    if (!teacher) {
      return res.status(404).json({
        status: "error",
        message: "Teacher not found in this college",
      });
    }
    const programme = await Programme.findOne({
      _id: programmeId,
      collegeId,
    });
    if (!programme) {
      return res.status(404).json({
        status: "error",
        message: "Programme not found in this college",
      });
    }
    if (!teacher.programmes.includes(programmeId)) {
      return res.status(400).json({
        status: "error",
        message: "Teacher is not assigned to this programme",
      });
    }
    teacher.programmes.pull(programmeId);
    await teacher.save();
    res.status(200).json({
      status: "ok",
      message: "Teacher revoked from programme",
    });
  } catch (error) {
    console.error("Error revoking teacher from programme:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to revoke teacher from programme",
    });
  }
};

export const updateTeacher = async (req, res) => {
  try {
    const collegeId = req.college._id;
    const { teacherId } = req.params;
    const { name, code, password, role, isActive } = req.body;
    if (!teacherId) {
      return res.status(400).json({
        status: "error",
        message: "Teacher ID is required",
      });
    }
    const teacher = await User.findOne({
      _id: teacherId,
      collegeId,
      role: { $in: ["HOD", "TEACHER"] },
    });
    if (!teacher) {
      return res.status(404).json({
        status: "error",
        message: "Teacher not found in this college",
      });
    }
    if (name) teacher.name = name;
    if (code) teacher.code = code.toUpperCase().trim();
    if (role) teacher.role = role.toUpperCase();
    if (isActive !== undefined) teacher.isActive = isActive;
    if (password) {
      teacher.password = await bcrypt.hash(password, 10);
      teacher.isPasswordSet = true;
    }
    await teacher.save();
    const safeTeacher = {
      _id: teacher._id,
      name: teacher.name,
      code: teacher.code,
      role: teacher.role,
      programmes: teacher.programmes,
      courses: teacher.courses,
      isActive: teacher.isActive,
      isPasswordSet: teacher.isPasswordSet,
    };
    res.status(200).json({
      status: "ok",
      message: "Teacher updated",
      teacher: safeTeacher,
    });
  } catch (error) {
    console.error("Error updating teacher:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update teacher",
    });
  }
};
