import express from "express";
import {
  createEvent,
  getAllEvents,
  deleteEvent,
} from "../controllers/event.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getAllEvents);
router.post("/", protect, createEvent);
router.delete("/:id", protect, deleteEvent);

export default router;
