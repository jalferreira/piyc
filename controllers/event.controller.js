import Event from "../models/event.model.js";
import Game from "../models/game.model.js";
import Player from "../models/player.model.js";
import Team from "../models/team.model.js";

// Criar evento
export const createEvent = async (req, res) => {
  try {
    const { type, time, player, team, game } = req.body;

    if (!type || time === undefined || !player || !team || !game) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Verificar existência
    const existingGame = await Game.findById(game);
    if (!existingGame) {
      return res.status(404).json({ message: "Game not found" });
    }

    const existingPlayer = await Player.findById(player);
    if (!existingPlayer) {
      return res.status(404).json({ message: "Player not found" });
    }

    const existingTeam = await Team.findById(team);
    if (!existingTeam) {
      return res.status(404).json({ message: "Team not found" });
    }

    const event = await Event.create({
      type,
      time,
      player,
      team,
      game,
    });

    // Associar evento ao jogo
    existingGame.events.push(event._id);
    await existingGame.save();

    //  Associar evento ao jogador
    existingPlayer.events.push(event._id);
    await existingPlayer.save();

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
      .populate("player", "name number")
      .populate("team", "name")
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
      .populate("player", "name number")
      .populate("team", "name")
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



// Atualizar evento
export const updateEvent = async (req, res) => {
  try {
    const { type, time } = req.body;

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (type !== undefined) event.type = type;
    if (time !== undefined) event.time = time;

    const updatedEvent = await event.save();

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

    // Remover do jogo
    await Game.findByIdAndUpdate(event.game, {
      $pull: { events: event._id },
    });

    // Remover do jogador
    await Player.findByIdAndUpdate(event.player, {
      $pull: { events: event._id },
    });

    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.log("Error in deleteEvent:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
