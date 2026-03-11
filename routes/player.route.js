import express from "express";
import {
  createPlayer,
  getAllPlayers,
  getPlayerById,
  updatePlayer,
  deletePlayer,
  getPlayersByTeam,
  getTopScorer,
  getTopMVP,
} from "../controllers/player.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getAllPlayers);
router.post("/", protectRoute, createPlayer);
router.get("/topScorer", getTopScorer);
router.get("/topMVP", getTopMVP);
router.get("/byTeam", getPlayersByTeam);
router.put("/:id", protectRoute, updatePlayer);
router.get("/:id", getPlayerById);
router.delete("/:id", protectRoute, adminRoute, deletePlayer);

export default router;
