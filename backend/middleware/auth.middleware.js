// middleware/auth.middleware.js
import { verifyToken } from "../utilities/token.js";

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    const decoded = verifyToken(token);

    req.user = decoded; // attach user to request

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
