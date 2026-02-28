import express from "express";
import {
  createGroups,
  generateFinalSchedule,
} from "../controllers/fixtures.controller.js";

const router = express.Router();

router.post("/groups", createGroups);
router.post("/", generateFinalSchedule);

export default router;
