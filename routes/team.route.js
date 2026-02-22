import express from "express";
import {
  getAllTeams,
  getTeamById,
  createTeam,
  deleteTeam,
  editTeam,
  getStandings,
} from "../controllers/team.controller.js";
import { upload } from "../lib/multer.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getAllTeams);
router.get("/:id", getTeamById);
router.post("/", upload.single("image"), createTeam);
router.put("/:id", upload.single("image"), editTeam);
router.delete("/:id", deleteTeam);
router.get("/standings", getStandings);

export default router;
