import express from "express";
import {
  getAllTeams,
  createTeam,
  deleteTeam,
  editTeam,
} from "../controllers/team.controller.js";

const router = express.Router();

router.get("/", getAllTeams);
router.post("/", createTeam);
router.put("/:id", editTeam);
router.delete("/:id", deleteTeam);

export default router;
