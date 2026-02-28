import Team from "../models/team.model.js";
import Player from "../models/player.model.js";
import Event from "../models/event.model.js";

import { deleteFile } from "../lib/multer.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find();
    res.status(200).json({ teams });
  } catch (error) {
    console.log("Error in getAllTeams controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate("players");
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    res.status(200).json(team);
  } catch (error) {
    console.log("Error in getTeamById controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createTeam = async (req, res) => {
  try {
    const { players, name, country, group } = req.body;
    let imageUrl = "";

    if (req.file) {
      imageUrl = `/uploads/teams/${req.file.filename}`;
    }

    const team = await Team.create({
      name,
      country,
      players: players || [],
      image: imageUrl,
      group: group || null,
    });

    res.status(201).json(team);
  } catch (error) {
    if (req.file) {
      deleteFile(req.file.path);
    }
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
        const filePath = path.join(
          __dirname,
          "..",
          "public",
          team.image.replace(/^\//, ""),
        );
        deleteFile(filePath);
      } catch (e) {}
    }

    await Team.findByIdAndDelete(req.params.id);
    await Player.deleteMany({ team: req.params.id });
    await Event.deleteMany({ team: req.params.id });
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

    const { name, country, players, group } = req.body;

    if (name !== undefined) team.name = name;
    if (country !== undefined) team.country = country;
    if (players !== undefined) team.players = players;
    if (group !== undefined) team.group = group;

    if (req.file) {
      if (team.image) {
        try {
          const filePath = path.join(
            __dirname,
            "..",
            "public",
            team.image.replace(/^\//, ""),
          );
          deleteFile(filePath);
        } catch (e) {}
      }
      team.image = `/uploads/teams/${req.file.filename}`;
    }

    const updatedTeam = await team.save();
    res.json(updatedTeam);
  } catch (error) {
    if (req.file) {
      deleteFile(req.file.path);
    }
    console.log("Error in editTeam controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
