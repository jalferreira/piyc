import Event from "../models/event.model.js";
import Game from "../models/game.model.js";

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

    if (type === "golo" || type === "autogolo") {
      // use _id of populated team objects for comparison
      const homeId = existingGame.teams[0]._id.toString();
      const awayId = existingGame.teams[1]._id.toString();

      if (type === "golo") {
        if (team.toString() === homeId) {
          existingGame.result.homeScore += 1;
        } else if (team.toString() === awayId) {
          existingGame.result.awayScore += 1;
        }
      } else if (type === "autogolo") {
        if (team.toString() === homeId) {
          existingGame.result.awayScore += 1;
        } else if (team.toString() === awayId) {
          existingGame.result.homeScore += 1;
        }
      }
    }

    existingGame.events.push(event);

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
      .sort({ time: 1 });

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

//  Apagar evento
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const existingGame = await Game.findById(event.game).populate("teams");

    await Game.findByIdAndUpdate(event.game, {
      $pull: { events: event._id },
    });

    if (event.type === "golo" || event.type === "autogolo") {
      const homeId = existingGame.teams[0]._id.toString();
      const awayId = existingGame.teams[1]._id.toString();

      if (event.type === "golo") {
        if (event.team.toString() === homeId) {
          existingGame.result.homeScore -= 1;
        } else if (event.team.toString() === awayId) {
          existingGame.result.awayScore -= 1;
        }
      } else if (event.type === "autogolo") {
        if (event.team.toString() === homeId) {
          existingGame.result.awayScore -= 1;
        } else if (event.team.toString() === awayId) {
          existingGame.result.homeScore -= 1;
        }
      }
      await existingGame.save();
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.log("Error in deleteEvent:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
