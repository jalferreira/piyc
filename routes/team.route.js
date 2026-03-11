import express from "express";
import {
  getAllTeams,
  getTeamById,
  createTeam,
  deleteTeam,
  editTeam,
} from "../controllers/team.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getAllTeams);
router.get("/:id", getTeamById);
router.post("/", protectRoute, createTeam);
router.put("/:id", protectRoute, editTeam);
router.delete("/:id", protectRoute, adminRoute, deleteTeam);

export default router;
