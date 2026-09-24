import Event from "../models/event.model.js";
import Game from "../models/game.model.js";
import { updateGameResult } from "./game.controller.js";

// Tipos de evento visíveis apenas ao staff (gameMaster/admin) — não são exibidos no site público
const STAFF_ONLY_EVENT_TYPES = ["oportunidade de golo", "lance de perigo"];
const isStaffOnlyType = (type) => STAFF_ONLY_EVENT_TYPES.includes(type);

// Criar evento
export const createEvent = async (req, res) => {
  try {
    const { type, time, player, team, game } = req.body;

    if (!type || !time || !player || !team || !game) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (isStaffOnlyType(type) && !req.user) {
      return res
        .status(403)
        .json({ message: "Access denied - Staff only event type" });
    }

    // Grande penalidade (desempate) acontece depois do fim do jogo, fora do limite normal de tempo
    if (type !== "grande penalidade" && (time < 0 || time > 60)) {
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
    const isStaff = !!req.user;

    const filter = isStaff ? {} : { type: { $nin: STAFF_ONLY_EVENT_TYPES } };

    const events = await Event.find(filter)
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

    if (isStaffOnlyType(event.type) && !req.user) {
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
      const effectiveType = type || event.type;
      if (effectiveType !== "grande penalidade" && (time < 0 || time > 60)) {
        return res
          .status(400)
          .json({ message: "Time must be between 0 and 60 minutes" });
      }
      event.time = time;
    }

    if (type) {
      const validTypes = [
        "cartao amarelo",
        "cartao vermelho",
        "golo",
        "autogolo",
        "penalty",
        "penalty falhado",
        "oportunidade de golo",
        "lance de perigo",
        "grande penalidade",
      ];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ message: "Invalid event type" });
      }
      if (isStaffOnlyType(type) && !req.user) {
        return res
          .status(403)
          .json({ message: "Access denied - Staff only event type" });
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

// Escapa um valor para uma célula CSV (RFC 4180)
const csvEscape = (value) => {
  const str = value === undefined || value === null ? "" : String(value);
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const VALID_EVENT_TYPES = [
  "cartao amarelo",
  "cartao vermelho",
  "golo",
  "autogolo",
  "penalty",
  "penalty falhado",
  "grande penalidade",
  ...STAFF_ONLY_EVENT_TYPES,
];

//  Exportar eventos (staff autenticado: gameMaster ou admin) — para criação de highlights em vídeo
//  Por omissão exporta TODOS os tipos de evento (incluindo "oportunidade de golo" e "lance de perigo").
//  Query params opcionais:
//    - game=<id>   -> filtra apenas os eventos desse jogo (todos os dados do jogo) — uso recomendado
//    - type=<tipo> -> filtra por um único tipo de evento
//    - format=csv|json (default: csv)
export const exportEvents = async (req, res) => {
  try {
    const { game, type } = req.query;
    const format = (req.query.format || "csv").toLowerCase();

    if (!["csv", "json"].includes(format)) {
      return res
        .status(400)
        .json({ message: "Invalid format. Use 'csv' or 'json'" });
    }

    if (type && !VALID_EVENT_TYPES.includes(type)) {
      return res.status(400).json({ message: "Invalid event type" });
    }

    const filter = {};
    if (game) filter.game = game;
    if (type) filter.type = type;

    const events = await Event.find(filter)
      .populate("player")
      .populate("team")
      .populate({ path: "game", populate: { path: "teams" } })
      .sort({ "game.n_jogo": 1, time: 1 });

    const rows = events.map((e) => ({
      eventId: e._id.toString(),
      tipo: e.type,
      jogo: e.game?.n_jogo ?? "",
      dataJogo: e.game?.date ? new Date(e.game.date).toISOString() : "",
      campo: e.game?.field ?? "",
      equipas: e.game?.teams?.map((t) => t.name).join(" vs ") ?? "",
      resultado: e.game?.result
        ? `${e.game.result.homeScore}-${e.game.result.awayScore}`
        : "",
      minuto: e.time,
      jogador: e.player?.name ?? "",
      numeroJogador: e.player?.number ?? "",
      equipaDoJogador: e.team?.name ?? "",
      criadoEm: e.createdAt ? new Date(e.createdAt).toISOString() : "",
    }));

    const filenameBase = game ? `jogo-${game}-eventos` : "eventos";

    if (format === "json") {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filenameBase}.json"`,
      );
      return res.json({ events: rows });
    }

    const headers = [
      "eventId",
      "tipo",
      "jogo",
      "dataJogo",
      "campo",
      "equipas",
      "resultado",
      "minuto",
      "jogador",
      "numeroJogador",
      "equipaDoJogador",
      "criadoEm",
    ];

    const csvLines = [
      headers.join(","),
      ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(",")),
    ];
    const csv = csvLines.join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filenameBase}.csv"`,
    );
    res.status(200).send(csv);
  } catch (error) {
    console.log("Error in exportEvents:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
