import Player from "../models/player.model.js";
import Team from "../models/team.model.js";
import Event from "../models/event.model.js";
import Game from "../models/game.model.js";

// Criar jogador
export const createPlayer = async (req, res) => {
  try {
    const { name, number, image, team } = req.body;

    if (!name || !number || !team) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const existingTeam = await Team.findOne({ _id: team }).populate("players");
    if (!existingTeam) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Verificar se já existe um player com esse número ou nome nesta equipa
    const existingPlayer = existingTeam.players.some(
      (player) => player.number == number && player.name == name,
    );

    if (existingPlayer) {
      return res.status(400).json({
        message: "Player with this number or name already exists in the team",
      });
    }

    const player = await Player.create({
      name,
      number,
      image: image || "",
      team: existingTeam._id,
    }).then(async (newPlayer) => {
      existingTeam.players.push(newPlayer);
      await existingTeam.save();
      return newPlayer;
    });

    res.status(201).json(player);
  } catch (error) {
    console.log("Error in createPlayer:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Listar todos os jogadores
export const getAllPlayers = async (req, res) => {
  try {
    const players = await Player.find();

    const sortedPlayers = players.sort((a, b) => a.number - b.number);

    res.json({ players: sortedPlayers });
  } catch (error) {
    console.log("Error in getAllPlayers:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTopScorer = async (req, res) => {
  try {
    const event = await Event.find({ type: "golo" }).populate("player");
    const scorerCount = {};

    if (event.length === 0) {
      return res.status(404).json({ message: "No goals scored yet" });
    }

    event.forEach((e) => {
      const playerId = e.player._id.toString();
      if (!scorerCount[playerId]) {
        scorerCount[playerId] = { player: e.player, goals: 0 };
      }
      scorerCount[playerId].goals += 1;
    });

    const topScorer = Object.values(scorerCount).sort(
      (a, b) => b.goals - a.goals,
    );

    if (!topScorer) {
      return res.status(404).json({ message: "No goals scored yet" });
    }
    res.json({ topScorers: topScorer });
  } catch (error) {
    console.log("Error in getTopScorer:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTopMVP = async (req, res) => {
  try {
    const games = await Game.find().populate("mvp");
    const mvpCount = {};

    games.forEach((game) => {
      if (game.mvp) {
        const playerId = game.mvp._id.toString();
        if (!mvpCount[playerId]) {
          mvpCount[playerId] = { player: game.mvp, mvps: 0 };
        }
        mvpCount[playerId].mvps += 1;
      }
    });

    const sortedMvps = Object.values(mvpCount).sort((a, b) => b.mvps - a.mvps);

    if (sortedMvps.length === 0) {
      return res.status(404).json({ message: "No MVPs awarded yet" });
    }

    res.status(200).json({ mvps: sortedMvps });
  } catch (error) {
    console.log("Error in getTopMVP:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPlayersByTeam = async (req, res) => {
  try {
    const team = await Team.findOne({ name: req.body.teamName }).populate(
      "players",
    );
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const sortedPlayers = team.players.sort((a, b) => a.number - b.number);

    res.status(200).json({ players: sortedPlayers });
  } catch (error) {
    console.log("Error in getPlayersByTeam:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Obter jogador por ID
export const getPlayerById = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);

    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    res.json(player);
  } catch (error) {
    console.log("Error in getPlayerById:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Editar jogador
export const updatePlayer = async (req, res) => {
  try {
    const { name, number, image, team: teamName } = req.body;

    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    if (name !== undefined) player.name = name;
    if (number !== undefined) player.number = number;
    if (image !== undefined) player.image = image;
    if (teamName !== undefined) {
      const team = await Team.findOne({ name: teamName });
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      player.team = team._id;
    }

    const updatedPlayer = await player.save();

    res.json(updatedPlayer);
  } catch (error) {
    console.log("Error in updatePlayer:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

//  Apagar jogador
export const deletePlayer = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);

    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    const eventDocs = await Event.find({ player: player._id }).select("_id");
    const eventIds = eventDocs.map((event) => event._id);

    await Event.deleteMany({ player: player._id });

    if (eventIds.length > 0) {
      await Game.updateMany(
        { events: { $in: eventIds } },
        { $pull: { events: { $in: eventIds } } },
      );
    }

    await Game.updateMany({ mvp: player._id }, { $unset: { mvp: "" } });

    await Team.findByIdAndUpdate(player.team, {
      $pull: { players: player._id },
    });

    await Player.findByIdAndDelete(player._id);

    res.json({ message: "Player deleted successfully" });
  } catch (error) {
    console.log("Error in deletePlayer:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
