import Team from "../models/team.model.js";
import Player from "../models/player.model.js";
import Event from "../models/event.model.js";

export const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find();
    res.status(200).json({ teams }).populate("players");
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
    const { players, name, country, group, image } = req.body;

    const team = await Team.create({
      name,
      country,
      players: players || [],
      image: image || "",
      group: group || null,
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

    if (req.body.image !== undefined) {
      team.image = req.body.image;
    }

    const updatedTeam = await team.save();
    res.json(updatedTeam);
  } catch (error) {
    console.log("Error in editTeam controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
