// Express framework → used to build APIs and handle routes
import express from "express";

// Helps read cookies sent from browser (used for auth, sessions)
import cookieParser from "cookie-parser";

// Node's core module → creates HTTP server (better control & scalability)
import http from "http";

// Loads environment variables from .env file (PORT, DB URL, frontend URL)
import dotenv from "dotenv";

// Allows frontend to talk to backend safely (avoids CORS errors)
import cors from "cors";

// Your custom function to connect database (MongoDB probably)
import connectDb from "./config/db.js";

// Parses form data like: name=test&email=a@gmail.com
import bodyParser from "body-parser";

// Importing routes
import authRoutes from "./routes/auth.route.js";
import superAdminRoutes from "./routes/superAdmin.routes.js";
import { authMiddleware } from "./middleware/auth.middleware.js";
import { allowRoles } from "./middleware/role.middleware.js";

// Load all variables from .env into process.env
dotenv.config();

// Create Express app
const app = express();

// Allow requests only from your frontend + allow cookies
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

// Allows server to read JSON data from requests (req.body)
app.use(express.json());

// Allows server to read cookies (req.cookies)
app.use(cookieParser());

// Allows server to read form submitted data
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/auth", authRoutes);
app.use(
  "/super_admin",
  authMiddleware,
  allowRoles("SUPER_ADMIN"),
  superAdminRoutes,
);
// Test route to check server is running
app.get("/ping", (req, res) => {
  console.log("Received ping request");
  res.json({ status: "ok", message: "ping successfull" });
});
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "test" });
});

// Server port (from .env or default 8000)
const PORT = process.env.PORT || 8000;

// Create HTTP server using Express app
const server = http.createServer(app);

// Connect database first, then start server
connectDb().then(() => {
  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
});
