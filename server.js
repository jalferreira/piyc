import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import teamRoutes from "./routes/team.route.js";
import eventRoutes from "./routes/event.route.js";
import gameRoutes from "./routes/game.route.js";
import playerRoutes from "./routes/player.route.js";

import { connectDB } from "./lib/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

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

app.use("/api/auth", authRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/players", playerRoutes);

connectDB();

app.listen(PORT, () => {
  console.log("Server is running on http://localhost:" + PORT);
});
