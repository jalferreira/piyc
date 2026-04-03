import Team from "../models/team.model.js";
import Game from "../models/game.model.js";
import {
  buildGroupStandings,
  normalizeGroupLabel,
} from "./standings.controller.js";

const getSourceTeamByPosition = (standings, group, place) => {
  const normalizedGroup = normalizeGroupLabel(group);
  const groupStanding = standings[normalizedGroup] || [];
  return groupStanding[place - 1]?.teamId || null;
};

const getMatchOutcomeTeam = (sourceGame, outcome) => {
  if (!sourceGame || sourceGame.status !== "completed") return null;
  const homeScore = sourceGame.result?.homeScore ?? 0;
  const awayScore = sourceGame.result?.awayScore ?? 0;
  if (homeScore === awayScore) return null;

  const homeId =
    sourceGame.teams[0]?._id?.toString?.() ?? sourceGame.teams[0]?.toString?.();
  const awayId =
    sourceGame.teams[1]?._id?.toString?.() ?? sourceGame.teams[1]?.toString?.();
  if (!homeId || !awayId) return null;

  const winnerId = homeScore > awayScore ? homeId : awayId;
  const loserId = homeScore > awayScore ? awayId : homeId;
  return outcome === "winner" ? winnerId : loserId;
};

const tryResolveGameTeams = (game, standings, gamesByNumber) => {
  const original = [...(game.teams || [])];
  const resolved = [original[0] ?? null, original[1] ?? null];

  if (game.homeSource) {
    if (game.homeSource.sourceType === "position") {
      const team = getSourceTeamByPosition(
        standings,
        game.homeSource.group,
        game.homeSource.place,
      );
      if (team) resolved[0] = team._id;
    } else if (game.homeSource.sourceType === "match") {
      const sourceGame = gamesByNumber[game.homeSource.matchNumber];
      const teamId = getMatchOutcomeTeam(sourceGame, game.homeSource.outcome);
      if (teamId) resolved[0] = teamId;
    }
  }

  if (game.awaySource) {
    if (game.awaySource.sourceType === "position") {
      const team = getSourceTeamByPosition(
        standings,
        game.awaySource.group,
        game.awaySource.place,
      );
      if (team) resolved[1] = team._id;
    } else if (game.awaySource.sourceType === "match") {
      const sourceGame = gamesByNumber[game.awaySource.matchNumber];
      const teamId = getMatchOutcomeTeam(sourceGame, game.awaySource.outcome);
      if (teamId) resolved[1] = teamId;
    }
  }

  if (
    resolved[0] &&
    resolved[1] &&
    resolved[0].toString() === resolved[1].toString()
  ) {
    console.warn(
      `⚠️ Jogo ${game.n_jogo}: mesma equipa atribuída a casa e fora.`,
    );
    return { resolved: original, changed: false };
  }

  const changed =
    resolved[0]?.toString() !== original[0]?.toString() ||
    resolved[1]?.toString() !== original[1]?.toString();

  return { resolved, changed };
};

export const resolvePendingFinalGames = async () => {
  const finalGames = await Game.find({ n_jogo: { $gte: 41, $lte: 70 } }).sort({
    n_jogo: 1,
  });
  if (!finalGames.length) return [];

  const groupTeams = await Team.find({ group: { $exists: true, $ne: null } });
  const completedGroupGames = await Game.find({
    n_jogo: { $lte: 40 },
    status: "completed",
  })
    .populate("teams")
    .populate("events");

  const standings = buildGroupStandings(groupTeams, completedGroupGames);

  const gamesByNumber = {};
  finalGames.forEach((game) => {
    gamesByNumber[game.n_jogo] = game;
  });

  const savedGames = [];
  for (const game of finalGames) {
    const { resolved, changed } = tryResolveGameTeams(
      game,
      standings,
      gamesByNumber,
    );
    if (changed) {
      game.teams = resolved;
      await game.save();
      savedGames.push(game);
      gamesByNumber[game.n_jogo] = game;
    }
  }

  return savedGames;
};

const finalMatchDefinitions = [
  {
    n_jogo: 41,
    homeSource: { sourceType: "position", group: "A", place: 1 },
    awaySource: { sourceType: "position", group: "D", place: 2 },
    date: new Date("2026-04-03T14:00:00Z").toLocaleString("pt-PT"),
    field: "campo1",
  },
  {
    n_jogo: 42,
    homeSource: { sourceType: "position", group: "C", place: 1 },
    awaySource: { sourceType: "position", group: "B", place: 2 },
    date: new Date("2026-04-03T13:00:00Z").toLocaleString("pt-PT"),
    field: "campo3",
  },
  {
    n_jogo: 43,
    homeSource: { sourceType: "position", group: "A", place: 2 },
    awaySource: { sourceType: "position", group: "D", place: 1 },
    date: new Date("2026-04-03T14:00:00Z").toLocaleString("pt-PT"),
    field: "campo3",
  },
  {
    n_jogo: 44,
    homeSource: { sourceType: "position", group: "B", place: 1 },
    awaySource: { sourceType: "position", group: "C", place: 2 },
    date: new Date("2026-04-03T13:00:00Z").toLocaleString("pt-PT"),
    field: "campo1",
  },
  {
    n_jogo: 45,
    homeSource: { sourceType: "position", group: "A", place: 3 },
    awaySource: { sourceType: "position", group: "D", place: 4 },
    date: new Date("2026-04-03T14:00:00Z").toLocaleString("pt-PT"),
    field: "campo2",
  },
  {
    n_jogo: 46,
    homeSource: { sourceType: "position", group: "B", place: 3 },
    awaySource: { sourceType: "position", group: "C", place: 4 },
    date: new Date("2026-04-03T13:00:00Z").toLocaleString("pt-PT"),
    field: "campo2",
  },
  {
    n_jogo: 47,
    homeSource: { sourceType: "position", group: "A", place: 4 },
    awaySource: { sourceType: "position", group: "D", place: 3 },
    date: new Date("2026-04-03T15:00:00Z").toLocaleString("pt-PT"),
    field: "campo1",
  },
  {
    n_jogo: 48,
    homeSource: { sourceType: "position", group: "B", place: 4 },
    awaySource: { sourceType: "position", group: "C", place: 3 },
    date: new Date("2026-04-03T15:00:00Z").toLocaleString("pt-PT"),
    field: "campo2",
  },
  {
    n_jogo: 49,
    homeSource: { sourceType: "position", group: "A", place: 5 },
    awaySource: { sourceType: "position", group: "D", place: 5 },
    date: new Date("2026-04-03T15:00:00Z").toLocaleString("pt-PT"),
    field: "campo3",
  },
  {
    n_jogo: 50,
    homeSource: { sourceType: "position", group: "C", place: 5 },
    awaySource: { sourceType: "position", group: "B", place: 5 },
    date: new Date("2026-04-03T16:00:00Z").toLocaleString("pt-PT"),
    field: "campo1",
  },
  {
    n_jogo: 51,
    homeSource: { sourceType: "position", group: "A", place: 5 },
    awaySource: { sourceType: "position", group: "C", place: 5 },
    date: new Date("2026-04-04T09:00:00Z").toLocaleString("pt-PT"),
    field: "campo1",
  },
  {
    n_jogo: 52,
    homeSource: { sourceType: "position", group: "D", place: 5 },
    awaySource: { sourceType: "position", group: "B", place: 5 },
    date: new Date("2026-04-04T09:00:00Z").toLocaleString("pt-PT"),
    field: "campo2",
  },
  {
    n_jogo: 53,
    homeSource: { sourceType: "position", group: "B", place: 5 },
    awaySource: { sourceType: "position", group: "A", place: 5 },
    date: new Date("2026-04-03T18:00:00Z").toLocaleString("pt-PT"),
    field: "campo3",
  },
  {
    n_jogo: 54,
    homeSource: { sourceType: "position", group: "C", place: 5 },
    awaySource: { sourceType: "position", group: "D", place: 5 },
    date: new Date("2026-04-03T18:00:00Z").toLocaleString("pt-PT"),
    field: "campo2",
  },
  {
    n_jogo: 55,
    homeSource: { sourceType: "match", matchNumber: 41, outcome: "winner" },
    awaySource: { sourceType: "match", matchNumber: 42, outcome: "winner" },
    date: new Date("2026-04-03T17:00:00Z").toLocaleString("pt-PT"),
    field: "campo1",
  },
  {
    n_jogo: 56,
    homeSource: { sourceType: "match", matchNumber: 43, outcome: "winner" },
    awaySource: { sourceType: "match", matchNumber: 44, outcome: "winner" },
    date: new Date("2026-04-03T18:00:00Z").toLocaleString("pt-PT"),
    field: "campo1",
  },
  {
    n_jogo: 57,
    homeSource: { sourceType: "match", matchNumber: 41, outcome: "loser" },
    awaySource: { sourceType: "match", matchNumber: 42, outcome: "loser" },
    date: new Date("2026-04-03T16:00:00Z").toLocaleString("pt-PT"),
    field: "campo3",
  },
  {
    n_jogo: 58,
    homeSource: { sourceType: "match", matchNumber: 43, outcome: "loser" },
    awaySource: { sourceType: "match", matchNumber: 44, outcome: "loser" },
    date: new Date("2026-04-03T16:00:00Z").toLocaleString("pt-PT"),
    field: "campo2",
  },
  {
    n_jogo: 59,
    homeSource: { sourceType: "match", matchNumber: 45, outcome: "winner" },
    awaySource: { sourceType: "match", matchNumber: 46, outcome: "winner" },
    date: new Date("2026-04-03T19:00:00Z").toLocaleString("pt-PT"),
    field: "campo1",
  },
  {
    n_jogo: 60,
    homeSource: { sourceType: "match", matchNumber: 47, outcome: "winner" },
    awaySource: { sourceType: "match", matchNumber: 48, outcome: "winner" },
    date: new Date("2026-04-03T19:00:00Z").toLocaleString("pt-PT"),
    field: "campo2",
  },
  {
    n_jogo: 61,
    homeSource: { sourceType: "match", matchNumber: 45, outcome: "loser" },
    awaySource: { sourceType: "match", matchNumber: 46, outcome: "loser" },
    date: new Date("2026-04-03T17:00:00Z").toLocaleString("pt-PT"),
    field: "campo3",
  },
  {
    n_jogo: 62,
    homeSource: { sourceType: "match", matchNumber: 47, outcome: "loser" },
    awaySource: { sourceType: "match", matchNumber: 48, outcome: "loser" },
    date: new Date("2026-04-03T17:00:00Z").toLocaleString("pt-PT"),
    field: "campo2",
  },
  {
    n_jogo: 63,
    homeSource: { sourceType: "match", matchNumber: 61, outcome: "loser" },
    awaySource: { sourceType: "match", matchNumber: 62, outcome: "loser" },
    date: new Date("2026-04-04T09:00:00Z").toLocaleString("pt-PT"),
    field: "campo3",
  },
  {
    n_jogo: 64,
    homeSource: { sourceType: "match", matchNumber: 61, outcome: "winner" },
    awaySource: { sourceType: "match", matchNumber: 62, outcome: "winner" },
    date: new Date("2026-04-04T10:00:00Z").toLocaleString("pt-PT"),
    field: "campo1",
  },
  {
    n_jogo: 65,
    homeSource: { sourceType: "match", matchNumber: 59, outcome: "loser" },
    awaySource: { sourceType: "match", matchNumber: 60, outcome: "loser" },
    date: new Date("2026-04-04T10:00:00Z").toLocaleString("pt-PT"),
    field: "campo2",
  },
  {
    n_jogo: 66,
    homeSource: { sourceType: "match", matchNumber: 59, outcome: "winner" },
    awaySource: { sourceType: "match", matchNumber: 60, outcome: "winner" },
    date: new Date("2026-04-04T10:00:00Z").toLocaleString("pt-PT"),
    field: "campo3",
  },
  {
    n_jogo: 67,
    homeSource: { sourceType: "match", matchNumber: 57, outcome: "loser" },
    awaySource: { sourceType: "match", matchNumber: 58, outcome: "loser" },
    date: new Date("2026-04-04T11:00:00Z").toLocaleString("pt-PT"),
    field: "campo1",
  },
  {
    n_jogo: 68,
    homeSource: { sourceType: "match", matchNumber: 57, outcome: "winner" },
    awaySource: { sourceType: "match", matchNumber: 58, outcome: "winner" },
    date: new Date("2026-04-04T11:00:00Z").toLocaleString("pt-PT"),
    field: "campo2",
  },
  {
    n_jogo: 69,
    homeSource: { sourceType: "match", matchNumber: 55, outcome: "loser" },
    awaySource: { sourceType: "match", matchNumber: 56, outcome: "loser" },
    date: new Date("2026-04-04T11:00:00Z").toLocaleString("pt-PT"),
    field: "campo3",
  },
  {
    n_jogo: 70,
    homeSource: { sourceType: "match", matchNumber: 55, outcome: "winner" },
    awaySource: { sourceType: "match", matchNumber: 56, outcome: "winner" },
    date: new Date("2026-04-04T12:00:00Z").toLocaleString("pt-PT"),
    field: "campo3",
  },
];

const buildMatchDocument = (definition) => ({
  n_jogo: definition.n_jogo,
  status: "scheduled",
  date: definition.date,
  field: definition.field,
  events: [],
  result: { homeScore: 0, awayScore: 0 },
  teams: [],
  homeSource: definition.homeSource,
  awaySource: definition.awaySource,
});

export const ensureFinalScheduleExists = async () => {
  const finalCount = await Game.countDocuments({
    n_jogo: { $gte: 41, $lte: 70 },
  });

  if (finalCount > 0) return [];

  const createdGames = [];
  for (const definition of finalMatchDefinitions) {
    const created = await Game.create(buildMatchDocument(definition));
    createdGames.push(created);
  }

  return createdGames;
};

export const createGroups = async (req, res) => {
  try {
    const teams = await Team.find();
    if (teams.length === 0) {
      return res.status(400).json({ message: "No teams available" });
    }

    const shuffled = [...teams].sort(() => 0.5 - Math.random());
    const groups = [];
    let idx = 0;

    while (shuffled.length > 0) {
      const slice = shuffled.splice(0, 2);
      groups.push({ name: `Group ${idx + 1}`, teams: slice });
      idx++;
    }

    groups.forEach((group) => {
      group.teams.forEach((team) => {
        team.group = group.name;
        team.save();
      });
    });

    res.status(200).json({ groups });
  } catch (error) {
    console.log("Error in createGroups:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const generateFinalSchedule = async (req, res) => {
  try {
    await Game.deleteMany({ n_jogo: { $gte: 41, $lte: 70 } });

    for (const definition of finalMatchDefinitions) {
      await Game.create(buildMatchDocument(definition));
    }

    await resolvePendingFinalGames();

    const games = await Game.find({ n_jogo: { $gte: 41, $lte: 70 } })
      .sort({ n_jogo: 1 })
      .populate("teams");

    res.status(200).json({ games });
  } catch (error) {
    console.log("Error in generateFinalSchedule:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
