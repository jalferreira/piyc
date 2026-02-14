import express from "express";
import {
  login,
  logout,
  resetPassword,
  signup,
  refreshToken,
  getMe,
  changePassword,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/reset-password", resetPassword);
router.post("/refresh-token", refreshToken);
router.get("/me", getMe);
router.post("/change-password", changePassword);

export default router;
