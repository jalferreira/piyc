import Event from "../models/event.model.js";
import Game from "../models/game.model.js";
import { updateGameResult } from "./game.controller.js";

// Criar evento
export const createEvent = async (req, res) => {
  try {
    const { type, time, player, team, game } = req.body;

    if (!type || !time || !player || !team || !game) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (time < 0 || time > 60) {
      return res
        .status(400)
        .json({ message: "Time must be between 0 and 60 minutes" });
    }

    let existingGame = await Game.findById(game)
      .populate({
        path: "teams",
        populate: { path: "players" },
      })
      .populate("events");

    if (!existingGame) {
      return res.status(404).json({ message: "Game not found" });
    }

    const playerId = player.toString();
    const playerOnTeam = existingGame.teams.some((t) =>
      t.players.some((p) => p._id.toString() === playerId),
    );
    if (!playerOnTeam) {
      return res.status(404).json({ message: "Player not found on any team" });
    }

    const existingTeam = existingGame.teams.find(
      (t) => t._id.toString() === team,
    );
    if (!existingTeam) {
      return res.status(404).json({ message: "Team not found in game" });
    }

    let event = await Event.create({
      type,
      time,
      player,
      team,
      game,
    });

    existingGame.events.push(event);
    await updateGameResult(existingGame);
    await existingGame.save();

    event = await Event.findById(event._id)
      .populate("player")
      .populate("team")
      .populate("game");

    res.status(201).json(event);
  } catch (error) {
    console.log("Error in createEvent:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

//  Listar todos os eventos
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("player")
      .populate("team")
      .populate("game")
      .sort({ game: 1 });

    res.json({ events });
  } catch (error) {
    console.log("Error in getAllEvents:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

//  Obter evento por ID
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("player")
      .populate("team")
      .populate("game");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    console.log("Error in getEventById:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { type, time, player, team, game } = req.body;

    let event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const gameId = game || event.game;
    let existingGame = await Game.findById(gameId)
      .populate({
        path: "teams",
        populate: { path: "players" },
      })
      .populate("events");

    if (!existingGame) {
      return res.status(404).json({ message: "Game not found" });
    }

    if (time !== undefined) {
      if (time < 0 || time > 60) {
        return res
          .status(400)
          .json({ message: "Time must be between 0 and 60 minutes" });
      }
      event.time = time;
    }

    if (type) {
      const validTypes = ["goal", "yellow_card", "red_card", "penalty"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ message: "Invalid event type" });
      }
      event.type = type;
    }

    if (team) {
      const teamExists = existingGame.teams.some(
        (t) => t._id.toString() === team,
      );
      if (!teamExists) {
        return res.status(404).json({ message: "Team not found in this game" });
      }
      event.team = team;
    }

    if (player) {
      const playerExists = existingGame.teams.some((t) =>
        t.players.some((p) => p._id.toString() === player),
      );
      if (!playerExists) {
        return res
          .status(404)
          .json({ message: "Player not found on any team in this game" });
      }
      event.player = player;
    }

    if (game && game !== event.game.toString()) {
      event.game = game;
    }

    await event.save();

    const index = existingGame.events.findIndex(
      (ev) => ev._id.toString() === event._id.toString(),
    );

    if (index !== -1) {
      existingGame.events[index] = event;
    }

    await updateGameResult(existingGame);
    await existingGame.save();

    const updatedEvent = await Event.findById(event._id)
      .populate("player")
      .populate("team")
      .populate("game");

    res.json(updatedEvent);
  } catch (error) {
    console.log("Error in updateEvent:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

//  Apagar evento
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const existingGame = await Game.findById(event.game)
      .populate("teams")
      .populate("events");

    existingGame.events = existingGame.events.filter(
      (evt) => evt._id.toString() !== event._id.toString(),
    );

    await updateGameResult(existingGame);
    await existingGame.save();

    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.log("Error in deleteEvent:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
