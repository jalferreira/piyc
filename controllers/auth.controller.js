import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Gera access e refresh tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "60m",
  });

  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

// Guarda refresh token no Redis (7 dias)
const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(`refresh_token:${userId}`, refreshToken, {
    ex: 7 * 24 * 60 * 60,
  });
};

export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "Utilizador já existe. Por favor faça reset da password.",
      });
    }
    const user = await User.create({ name, email, password });

    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);

    // devolve tokens no body
    return res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      const { accessToken, refreshToken } = generateTokens(user._id);
      await storeRefreshToken(user._id, refreshToken);

      res.json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken,
        refreshToken,
      });
    } else {
      res.status(400).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.log("Error in login controller", error);
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email é obrigatório" });
  }

  try {
    console.log("Buscando usuário:", email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log("Usuário não encontrado:", email);
      return res.status(404).json({ message: "Email não encontrado" });
    }

    // Gera nova senha aleatória
    const randomPassword = Math.random().toString(36).slice(-8);
    console.log("Nova senha gerada:", randomPassword);

    // Atualiza password no banco
    user.password = randomPassword;
    try {
      await user.save(); // hash feito pelo pre-save hook
      console.log("Senha atualizada no banco com sucesso");
    } catch (saveError) {
      console.error("Erro ao salvar usuário:", saveError);
      return res.status(500).json({ message: "Erro ao atualizar senha" });
    }

    // Monta email usando SendGrid
    const msg = {
      to: user.email,
      from: process.env.SENDGRID_FROM_EMAIL, // remetente validado no SendGrid
      subject: "Reset da password",
      html: `
        <p>Olá colega,<br>
        A sua nova password é: <b>${randomPassword}</b><br>
        Por favor altere-a após login.<br><br>
        <p>Obrigado desde já.<br><br>
        Melhores Cumprimentos | Best Regards,<br>
        _____________________________________<br>
        LGSP - IT Team <br>
        Lufthansa Ground Services Portugal - LGSP <br>
        Av. da Boavista, 1837, sala 13.4 <br>
        4100-133 Porto – Portugal <br>
        Tel: +351 964 530 986 <br>
        Email: lgsp.it@dlh.de <br>
        www.lufthansa-lgsp.com</p>
      `,
    };

    try {
      await sgMail.send(msg);
      console.log("Email enviado com sucesso para:", user.email);
    } catch (sendError) {
      console.error("Erro ao enviar email via SendGrid:", sendError);
      // não retorna erro ao frontend — apenas loga
    }

    return res.status(200).json({
      message: "Nova password gerada e atualizada. Verifique seu email.",
    });
  } catch (error) {
    console.error("Erro geral no resetPassword:", error);
    return res
      .status(500)
      .json({ message: "Erro ao processar reset de senha" });
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body; // agora esperamos no body
    if (refreshToken) {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
      );
      await redis.del(`refresh_token:${decoded.userId}`);
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    // Access token no header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    console.log("Error in getMe:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body; // receber no body
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

    if (storedToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Rotating refresh token
    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "60m" },
    );
    const newRefreshToken = jwt.sign(
      { userId: decoded.userId },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" },
    );

    await storeRefreshToken(decoded.userId, newRefreshToken);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.log("Error in refreshToken controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Password antiga incorreta" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password alterada com sucesso!" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao alterar password" });
  }
};
