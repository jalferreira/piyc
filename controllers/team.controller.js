import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Team from "../models/team.model.js";

export const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find({});
    res.json({ teams });
  } catch (error) {
    console.log("Error in getAllTeams controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createTeam = async (req, res) => {
  try {
    const { players, name, country, image } = req.body;

    if (image) {
      const cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: "teams",
      });
      image = cloudinaryResponse.secure_url;
    }

    const team = await Team.create({
      name,
      country,
      players: players || [],
      image: image || "",
    });

    res.status(201).json(team);
  } catch (error) {
    console.log("Error in createTeam controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    if (team.image) {
      try {
        await cloudinary.uploader.destroy(`teams/${team.image}`);
      } catch (e) {}
    }

    await Team.findByIdAndDelete(req.params.id);
    res.json({ message: "Team deleted successfully" });
  } catch (error) {
    console.log("Error in deleteTeam controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const editTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    const { name, country, players, image } = req.body;

    if (name !== undefined) team.name = name;
    if (country !== undefined) team.country = country;
    if (players !== undefined) team.players = players;

    if (image !== undefined) {
      if (team.image) {
        try {
          await cloudinary.uploader.destroy(`teams/${team.image}`);
        } catch (e) {}
      }
      const cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: "teams",
      });
      team.image = cloudinaryResponse.secure_url;
    }

    const updatedTeam = await team.save();
    await updateFeaturedTeamsCache();
    res.json(updatedTeam);
  } catch (error) {
    console.log("Error in editTeam controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
