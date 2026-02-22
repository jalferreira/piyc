import Player from "../models/player.model.js";
import Team from "../models/team.model.js";

// Criar jogador
export const createPlayer = async (req, res) => {
  try {
    const { name, position, number, team } = req.body;

    if (!name || !position || !number || !team) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const existingTeam = await Team.findOne({ name: team }).populate("players");
    if (!existingTeam) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Verificar se já existe um player com esse número ou nome nesta equipa
    const existingPlayer = existingTeam.players.some(
      (player) => player.number == number || player.name == name,
    );

    if (existingPlayer) {
      return res.status(400).json({
        message: "Player with this number or name already exists in the team",
      });
    }

    const player = await Player.create({
      name,
      position,
      number,
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

    const positionOrder = {
      "guarda-redes": 1,
      defesa: 2,
      medio: 3,
      avancado: 4,
    };

    const sortedPlayers = players.sort(
      (a, b) => positionOrder[a.position] - positionOrder[b.position],
    );

    res.json({ players: sortedPlayers });
  } catch (error) {
    console.log("Error in getAllPlayers:", error.message);
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
    const { name, position, number } = req.body;

    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    if (name !== undefined) player.name = name;
    if (position !== undefined) player.position = position;
    if (number !== undefined) player.number = number;

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

    await Player.findByIdAndDelete(req.params.id);

    res.json({ message: "Player deleted successfully" });
  } catch (error) {
    console.log("Error in deletePlayer:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
