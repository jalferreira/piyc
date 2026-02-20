import express from "express";
import {
  getAllTeams,
  createTeam,
  deleteTeam,
  editTeam,
} from "../controllers/team.controller.js";
import { upload } from "../lib/multer.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protectRoute, getAllTeams);
router.post("/", upload.single("image"), protectRoute, createTeam);
router.put("/:id", upload.single("image"), protectRoute, editTeam);
router.delete("/:id", protectRoute, deleteTeam);

export default router;
