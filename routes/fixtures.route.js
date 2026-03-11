import express from "express";
import {
  createGroups,
  generateFinalSchedule,
} from "../controllers/fixtures.controller.js";

import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/groups", protectRoute, adminRoute, createGroups);
router.post("/", protectRoute, adminRoute, generateFinalSchedule);

export default router;
