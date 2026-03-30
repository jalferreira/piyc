import express from "express";
import {
  login,
  logout,
  resetPassword,
  signup,
  changePassword,
  refreshToken,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refreshToken", refreshToken);
router.post("/reset-password", resetPassword);
router.post("/change-password", changePassword);

export default router;
