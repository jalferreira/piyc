import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import teamRoutes from "./routes/team.route.js";
import eventRoutes from "./routes/event.route.js";
import gameRoutes from "./routes/game.route.js";
import standingsRoutes from "./routes/standings.route.js";

import { connectDB } from "./lib/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "*",
  "https://www.lgspintercontinentalyouthcup.com",
  "https://lgspintercontinentalyouthcup.com/",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS: " + origin));
      }
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  }),
);

app.options("*", (req, res) => {
  res.sendStatus(200);
});

app.use("/uploads", express.static("public/uploads"));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/standings", standingsRoutes);
app.use("/api/games", gameRoutes);

connectDB();

app.listen(PORT, () => {
  console.log("Server is running on http://localhost:" + PORT);
});
