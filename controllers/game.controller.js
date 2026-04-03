import Game from "../models/game.model.js";
import Team from "../models/team.model.js";
import Event from "../models/event.model.js";
import {
  resolvePendingFinalGames,
  ensureFinalScheduleExists,
} from "./fixtures.controller.js";

const normalizeId = (value) => {
  if (!value) return null;
  if (value._id) return value._id.toString();
  return value.toString();
};

export const calculateGameResult = (game) => {
  let homeScore = 0;
  let awayScore = 0;

  const goals = (game.events || []).filter(
    (event) =>
      event.type === "golo" ||
      event.type === "autogolo" ||
      event.type === "penalty",
  );

  const firstTeamId = normalizeId(game.teams[0]);
  const secondTeamId = normalizeId(game.teams[1]);

  goals.forEach((goal) => {
    const goalTeamId = normalizeId(goal.team);

    if (goal.type === "golo") {
      if (goalTeamId === firstTeamId) {
        homeScore++;
      } else if (goalTeamId === secondTeamId) {
        awayScore++;
      }
    } else if (goal.type === "autogolo") {
      if (goalTeamId === firstTeamId) {
        awayScore++;
      } else if (goalTeamId === secondTeamId) {
        homeScore++;
      }
    } else if (goal.type === "penalty") {
      if (goalTeamId === firstTeamId) {
        homeScore++;
      } else if (goalTeamId === secondTeamId) {
        awayScore++;
      }
    }
  });

  return { homeScore, awayScore };
};

export const updateGameResult = async (game) => {
  const result = calculateGameResult(game);

  if (
    !game.result ||
    game.result.homeScore !== result.homeScore ||
    game.result.awayScore !== result.awayScore
  ) {
    game.result = result;
    await game.save();
  }

  return game;
};

export const createGame = async (req, res) => {
  try {
    const { teams, status, field, n_jogo, date } = req.body;

    if (!teams || teams.length !== 2) {
      return res.status(400).json({
        message: "Game must have exactly 2 teams",
        received: { teams },
      });
    }

    const existingTeams = await Team.find({ _id: { $in: teams } });

    if (existingTeams.length !== 2) {
      return res.status(404).json({ message: "One or more teams not found" });
    }

    const game = await Game.create({
      teams: existingTeams.map((team) => team._id),
      events: [],
      n_jogo: n_jogo,
      date: date || Date.now(),
      field: field || null,
      status: status || "scheduled",
      mvp: null,
      result: { homeScore: 0, awayScore: 0 },
    });

    res.status(201).json(game);
  } catch (error) {
    console.log("Error in createGame:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getAllGames = async (req, res) => {
  try {
    const games = await Game.find()
      .populate("teams")
      .populate("events")
      .populate("mvp")
      .sort({ date: 1 });

    await Promise.all(games.map((game) => updateGameResult(game)));

    res.json({ games });
  } catch (error) {
    console.log("Error in getAllGames:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getGameById = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate("teams")
      .populate("events")
      .populate("mvp")
      .populate("result");

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    const updatedGame = await updateGameResult(game);

    res.json(updatedGame);
  } catch (error) {
    console.log("Error in getGameById:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateGame = async (req, res) => {
  try {
    const { teams, status, mvp, n_jogo, result, date, field } = req.body;

    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    if (teams) {
      if (teams.length !== 2) {
        return res
          .status(400)
          .json({ message: "Game must have exactly 2 teams" });
      }

      const existingTeams = await Team.find({ _id: { $in: teams } });

      if (existingTeams.length !== 2) {
        return res.status(404).json({ message: "One or more teams not found" });
      }

      game.teams = teams;
    }

    if (status) {
      const validStatuses = ["scheduled", "in_progress", "completed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message:
            "Invalid status. Must be: scheduled, in_progress, or completed",
        });
      }
      game.status = status;
    }

    if (n_jogo) {
      game.n_jogo = n_jogo;
    }

    if (field) {
      game.field = field;
    }

    if (date) {
      game.date = date;
    }

    if (mvp !== undefined) {
      if (mvp) {
        const teamsWithPlayers = await Team.find({
          _id: { $in: game.teams },
        }).populate("players");

        const playerExists = teamsWithPlayers.some((team) =>
          team.players.some((player) => player._id.toString() === mvp),
        );

        if (!playerExists) {
          return res.status(404).json({ message: "MVP player not found" });
        }
      }

      game.mvp = mvp || null;
    }

    if (result !== undefined) {
      game.result = result;
    }

    const updatedGame = await game.save();

    if (updatedGame.status === "completed") {
      await ensureFinalScheduleExists();
      await resolvePendingFinalGames();
    }

    res.json(updatedGame);
  } catch (error) {
    console.log("Error in updateGame:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteGame = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    if (game.events && game.events.length > 0) {
      await Event.deleteMany({ game: req.params.id });
    }

    await Game.findByIdAndDelete(req.params.id);

    res.json({ message: "Game deleted successfully" });
  } catch (error) {
    console.log("Error in deleteGame:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
