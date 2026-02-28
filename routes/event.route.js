import express from "express";
import {
  createEvent,
  getAllEvents,
  deleteEvent,
  getEventById,
} from "../controllers/event.controller.js";

import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getAllEvents);
router.post("/", createEvent);
router.get("/:id", getEventById);
router.delete("/:id", deleteEvent);

export default router;
