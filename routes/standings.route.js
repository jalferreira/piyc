import express from "express";
import {
  getGlobalStandings,
  getStandingsByGroup,
  getStandingsLive,
  getStandingsByGroupLive,
  getFinalStandings,
} from "../controllers/standings.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getGlobalStandings);
router.get("/byGroup", getStandingsByGroup);
router.get("/live", getStandingsLive);
router.get("/byGroupLive", getStandingsByGroupLive);
router.get("/final", getFinalStandings);

export default router;
