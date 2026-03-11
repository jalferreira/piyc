import express from "express";
import {
  createGame,
  getAllGames,
  getGameById,
  updateGame,
  deleteGame,
} from "../controllers/game.controller.js";

import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getAllGames);
router.get("/:id", getGameById);
router.post("/", protectRoute, createGame);
router.put("/:id", protectRoute, updateGame);
router.delete("/:id", protectRoute, adminRoute, deleteGame);

export default router;
