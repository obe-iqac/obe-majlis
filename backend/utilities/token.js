import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
export function generateToken(user) {
  return jwt.sign(
    {
      _id: user._id,
      role: user.role,
      collegeId: user.collegeId || null,
      departmentId: user.departmentId || null,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}


export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
