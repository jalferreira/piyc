import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const ACCESS_TOKEN_EXPIRATION = "60m";
const REFRESH_TOKEN_EXPIRATION = "7d";

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId: userId.toString() },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRATION,
    },
  );

  const refreshToken = jwt.sign(
    {
      userId: userId.toString(),
      jti: crypto.randomUUID(),
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRATION,
    },
  );

  return {
    accessToken,
    refreshToken,
  };
};

const storeRefreshToken = async (userId, refreshToken) => {
  await User.findByIdAndUpdate(userId, {
    refreshTokenHash: hashToken(refreshToken),
  });
};

const verifyAccessToken = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    const error = new Error("Access token não fornecido");
    error.statusCode = 401;
    throw error;
  }

  const accessToken = authHeader.split(" ")[1];

  try {
    return jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
  } catch {
    const error = new Error("Access token inválido ou expirado");
    error.statusCode = 401;
    throw error;
  }
};

export const signup = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const userExists = await User.findOne({
      email: email.toLowerCase(),
    });

    if (userExists) {
      return res.status(400).json({
        message: "Utilizador já existe. Faça reset da password.",
      });
    }

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      role: role || "gameMaster",
    });

    const { accessToken, refreshToken } = generateTokens(user._id);

    await storeRefreshToken(user._id, refreshToken);

    res.status(201).json({
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        message: "Email ou password inválidos",
      });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    await storeRefreshToken(user._id, refreshToken);

    res.json({
      message: "Login efetuado",
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token não fornecido",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({
        message: "Refresh token inválido",
      });
    }

    const tokenHash = hashToken(refreshToken);

    if (tokenHash !== user.refreshTokenHash) {
      return res.status(401).json({
        message: "Refresh token inválido",
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      generateTokens(user._id);

    user.refreshTokenHash = hashToken(newRefreshToken);

    await user.save({
      validateBeforeSave: false,
    });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error(error);

    res.status(401).json({
      message: "Refresh token inválido",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const decoded = verifyAccessToken(req);

    await User.findByIdAndUpdate(decoded.userId, {
      refreshTokenHash: null,
    });

    res.json({
      message: "Logout efetuado com sucesso",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message,
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const decoded = verifyAccessToken(req);

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        message: "Utilizador não encontrado",
      });
    }

    const match = await user.comparePassword(oldPassword);

    if (!match) {
      return res.status(400).json({
        message: "Password antiga incorreta",
      });
    }

    user.password = newPassword;

    user.refreshTokenHash = null;

    await user.save();

    res.json({
      message: "Password alterada com sucesso",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        message: "Email não encontrado",
      });
    }

    const temporaryPassword = crypto.randomBytes(12).toString("base64url");

    user.password = temporaryPassword;

    user.refreshTokenHash = null;

    await user.save();

    res.json({
      message: "Password resetada com sucesso",
      temporaryPassword,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
};
