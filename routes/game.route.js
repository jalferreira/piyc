import express from "express";
import {
  createGame,
  getAllGames,
  getGameById,
  updateGame,
  deleteGame,
} from "../controllers/game.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getAllGames);
router.get("/:id", getGameById);
router.post("/", protect, createGame);
router.put("/:id", protect, updateGame);
router.delete("/:id", protect, deleteGame);

export default router;
