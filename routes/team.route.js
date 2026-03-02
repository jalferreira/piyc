import express from "express";
import {
  getAllTeams,
  getTeamById,
  createTeam,
  deleteTeam,
  editTeam,
} from "../controllers/team.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getAllTeams);
router.get("/:id", getTeamById);
router.post("/", createTeam);
router.put("/:id", editTeam);
router.delete("/:id", deleteTeam);

export default router;
