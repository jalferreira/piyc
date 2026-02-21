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

router.get("/", getAllTeams);
router.post("/", upload.single("image"), createTeam);
router.put("/:id", upload.single("image"), editTeam);
router.delete("/:id", deleteTeam);

export default router;
