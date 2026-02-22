import express from "express";
import {
  createPlayer,
  getAllPlayers,
  getPlayerById,
  updatePlayer,
  deletePlayer,
} from "../controllers/player.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getAllPlayers);
router.post("/", createPlayer);
router.put("/:id", updatePlayer);
router.get("/:id", getPlayerById);
router.delete("/:id", deletePlayer);

export default router;
