import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const logDir = path.join(process.cwd(), "logs");
const logFile = path.join(logDir, "access.log");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export const requestLogger = async (req, res, next) => {
  let account = "anonymous";

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded.userId).select("email role");
      if (user) {
        account = `${user.email} (${user.role})`;
      }
    } catch (error) {
      account = "invalid-token";
    }
  }

  res.on("finish", () => {
    const line = `${new Date().toISOString()} | ${req.method} ${req.originalUrl} | ${account} | ${res.statusCode}\n`;
    fs.appendFile(logFile, line, (err) => {
      if (err) console.error("Error writing to access log:", err.message);
    });
  });

  next();
};
