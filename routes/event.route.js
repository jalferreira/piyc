import express from "express";
import {
  createEvent,
  getAllEvents,
  deleteEvent,
  getEventById,
  updateEvent,
} from "../controllers/event.controller.js";

import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getAllEvents);
router.post("/", protectRoute, createEvent);
router.get("/:id", getEventById);
router.put("/:id", protectRoute, updateEvent);
router.delete("/:id", protectRoute, adminRoute, deleteEvent);

export default router;
