import express from "express";
import {
  createEvent,
  getAllEvents,
  deleteEvent,
} from "../controllers/event.controller.js";

import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getAllEvents);
router.post("/", protectRoute, createEvent);
router.delete("/:id", protectRoute, deleteEvent);

export default router;
