import Team from "../models/team.model.js";
import { deleteFile } from "../lib/multer.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find({}).populate("players");
    res.json({ teams });
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
    res.json(team);
  } catch (error) {
    console.log("Error in getTeamById controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createTeam = async (req, res) => {
  try {
    const { players, name, country } = req.body;
    let imageUrl = "";

    if (req.file) {
      imageUrl = `/uploads/teams/${req.file.filename}`;
    }

    const team = await Team.create({
      name,
      country,
      players: players || [],
      image: imageUrl,
    });

    res.status(201).json(team);
  } catch (error) {
    // Delete uploaded file if there's an error
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

    const { name, country, players } = req.body;

    if (name !== undefined) team.name = name;
    if (country !== undefined) team.country = country;
    if (players !== undefined) team.players = players;

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
    await updateFeaturedTeamsCache();
    res.json(updatedTeam);
  } catch (error) {
    // Delete uploaded file if there's an error
    if (req.file) {
      deleteFile(req.file.path);
    }
    console.log("Error in editTeam controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getStandings = async (req, res) => {
  try {
    const teams = await Team.find();
    const games = await Game.find();

    const table = teams.map((team) => ({
      team: team.name,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    }));

    games.forEach((game) => {
      if (game.homeScore === undefined || game.awayScore === undefined) return;

      const home = table.find((t) => t.team === game.homeTeamName);
      const away = table.find((t) => t.team === game.awayTeamName);

      if (!home || !away) return;

      home.played++;
      away.played++;

      home.goalsFor += game.homeScore;
      home.goalsAgainst += game.awayScore;

      away.goalsFor += game.awayScore;
      away.goalsAgainst += game.homeScore;

      if (game.homeScore > game.awayScore) {
        home.wins++;
        home.points += 3;
        away.losses++;
      } else if (game.homeScore < game.awayScore) {
        away.wins++;
        away.points += 3;
        home.losses++;
      } else {
        home.draws++;
        away.draws++;
        home.points++;
        away.points++;
      }
    });

    table.forEach((t) => {
      t.goalDifference = t.goalsFor - t.goalsAgainst;
    });

    table.sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor,
    );

    res.json(table);
  } catch (error) {
    console.log("Error in getStandings:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
