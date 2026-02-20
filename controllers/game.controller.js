import Game from "../models/game.model.js";
import Team from "../models/team.model.js";


// Criar jogo
export const createGame = async (req, res) => {
  try {
    const { teams } = req.body;

    if (!teams || teams.length !== 2) {
      return res
        .status(400)
        .json({ message: "Game must have exactly 2 teams" });
    }

    // Verificar se equipas existem
    const existingTeams = await Team.find({ _id: { $in: teams } });

    if (existingTeams.length !== 2) {
      return res.status(404).json({ message: "One or more teams not found" });
    }

    const game = await Game.create({
      teams,
      events: [],
    });

    res.status(201).json(game);
  } catch (error) {
    console.log("Error in createGame:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};



// Listar todos os jogos
export const getAllGames = async (req, res) => {
  try {
    const games = await Game.find()
      .populate("teams", "name country")
      .populate("events")
      .sort({ createdAt: -1 });

    res.json({ games });
  } catch (error) {
    console.log("Error in getAllGames:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};



// Obter jogo por ID
export const getGameById = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate("teams", "name country")
      .populate("events");

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    res.json(game);
  } catch (error) {
    console.log("Error in getGameById:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};



// Editar jogo
export const updateGame = async (req, res) => {
  try {
    const { teams } = req.body;

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
        return res
          .status(404)
          .json({ message: "One or more teams not found" });
      }

      game.teams = teams;
    }

    const updatedGame = await game.save();

    res.json(updatedGame);
  } catch (error) {
    console.log("Error in updateGame:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};



// Apagar jogo
export const deleteGame = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    await Game.findByIdAndDelete(req.params.id);

    res.json({ message: "Game deleted successfully" });
  } catch (error) {
    console.log("Error in deleteGame:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
