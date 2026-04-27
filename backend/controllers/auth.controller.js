import User from "../model/User.js";
import bcrypt from "bcrypt";
import { generateToken, verifyToken } from "../utilities/token.js";
export const verifyCode = async (req, res) => {
  try {
    let { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Code is required" });
    }

    // normalize
    code = code.toUpperCase().trim();

    const user = await User.findOne({ code }).select(
      "code isPasswordSet isActive role",
    );

    if (!user) {
      return res.status(404).json({
        message: "Invalid code",
      });
    }

    // optional: block inactive users
    if (!user.isActive) {
      return res.status(403).json({
        message: "User is disabled",
      });
    }

    return res.status(200).json({
      exists: true,
      isPasswordSet: user.isPasswordSet,
      role: user.role, // optional (for frontend routing)
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};
export const setPassword = async (req, res) => {
  try {
    const { code, password } = req.body;
    if (!code || !password) {
      return res
        .status(400)
        .json({ message: "Code and password are required" });
    }

    const user = await User.findOne({ code: code.toUpperCase().trim() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.isPasswordSet) {
      return res.status(400).json({ message: "Password is already set" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.isPasswordSet = true;
    await user.save();
    return res.status(200).json({ message: "Password set successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
export const login = async (req, res) => {
  try {
    const { code, password } = req.body;
    if (!code || !password) {
      return res
        .status(400)
        .json({ message: "Code and password are required" });
    }

    const user = await User.findOne({ code: code.toUpperCase().trim() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: "User is disabled" });
    }
    if (!user.isPasswordSet) {
      return res.status(400).json({ message: "Password is not set" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = generateToken(user);
    const isProduction = process.env.NODE_ENV === "production";

    return res
      .status(200)
      .cookie("token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "lax" : "lax",
        domain: isProduction ? ".minhajap.xyz" : undefined,
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        message: "Login successful",
        role: user.role, // optional (for frontend routing)
      });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
export const verifyAuthToken = async (req, res) => {
  try {
    const token = req.headers.cookie?.split("=")[1];
    if (!token) {
      return res.status(401).json({ valid: false, message: "No token found" });
    }
    // If auth middleware passed, token is valid and user info is in req.user
    const decoded = verifyToken(token);
    return res.status(200).json({
      valid: true,
      role: decoded.role,
      collegeId: decoded.collegeId,
      departmentId: decoded.departmentId,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
