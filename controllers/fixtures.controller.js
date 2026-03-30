import Team from "../models/team.model.js";
import Game from "../models/game.model.js";

const normalizeGroupLabel = (group) => {
  if (!group) return null;
  const text = group.toString().trim();
  const match = text.match(/([A-D])/i);
  if (match) return match[1].toUpperCase();
  const numericMatch = text.match(/\b([1-4])\b/);
  if (numericMatch) {
    const mapping = { 1: "A", 2: "B", 3: "C", 4: "D" };
    return mapping[numericMatch[1]];
  }
  return text.toUpperCase();
};

const buildGroupStandings = (teams, completedGames) => {
  const grouped = {};

  teams.forEach((team) => {
    const group = normalizeGroupLabel(team.group);
    if (!group) return;

    if (!grouped[group]) {
      grouped[group] = {};
    }

    grouped[group][team._id.toString()] = {
      team,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      yellowCards: 0,
      redCards: 0,
    };
  });

  completedGames.forEach((game) => {
    const home = game.teams[0];
    const away = game.teams[1];
    if (!home || !away) return;

    const homeGroup = normalizeGroupLabel(home.group);
    const awayGroup = normalizeGroupLabel(away.group);
    if (!homeGroup || homeGroup !== awayGroup) return;

    const table = grouped[homeGroup];
    if (!table) return;

    const homeRow = table[home._id.toString()];
    const awayRow = table[away._id.toString()];
    if (!homeRow || !awayRow) return;

    const homeScore = game.result?.homeScore ?? 0;
    const awayScore = game.result?.awayScore ?? 0;

    homeRow.played++;
    awayRow.played++;
    homeRow.goalsFor += homeScore;
    homeRow.goalsAgainst += awayScore;
    awayRow.goalsFor += awayScore;
    awayRow.goalsAgainst += homeScore;

    if (homeScore > awayScore) {
      homeRow.wins++;
      homeRow.points += 3;
      awayRow.losses++;
    } else if (homeScore < awayScore) {
      awayRow.wins++;
      awayRow.points += 3;
      homeRow.losses++;
    } else {
      homeRow.draws++;
      awayRow.draws++;
      homeRow.points++;
      awayRow.points++;
    }

    game.events.forEach((evt) => {
      if (!evt.team) return;
      const isHome = evt.team.toString() === home._id.toString();
      const row = isHome ? homeRow : awayRow;
      if (evt.type === "cartao amarelo") row.yellowCards++;
      else if (evt.type === "cartao vermelho") row.redCards++;
    });
  });

  const standings = {};
  Object.entries(grouped).forEach(([group, table]) => {
    standings[group] = Object.values(table)
      .map((row) => ({
        ...row,
        goalDifference: row.goalsFor - row.goalsAgainst,
        cardPenalty: row.yellowCards + row.redCards,
      }))
      .sort(
        (a, b) =>
          b.points - a.points ||
          b.goalDifference - a.goalDifference ||
          b.goalsFor - a.goalsFor ||
          a.cardPenalty - b.cardPenalty ||
          a.team.name.localeCompare(b.team.name),
      );
  });

  return standings;
};

const getSourceTeamByPosition = (standings, group, place) => {
  const normalizedGroup = normalizeGroupLabel(group);
  const groupStanding = standings[normalizedGroup] || [];
  return groupStanding[place - 1]?.team || null;
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

  const changed =
    resolved[0]?.toString() !== original[0]?.toString() ||
    resolved[1]?.toString() !== original[1]?.toString();

  return { resolved: resolved.filter(Boolean), changed };
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
  },
  {
    n_jogo: 42,
    homeSource: { sourceType: "position", group: "C", place: 1 },
    awaySource: { sourceType: "position", group: "B", place: 2 },
  },
  {
    n_jogo: 43,
    homeSource: { sourceType: "position", group: "A", place: 2 },
    awaySource: { sourceType: "position", group: "D", place: 1 },
  },
  {
    n_jogo: 44,
    homeSource: { sourceType: "position", group: "B", place: 1 },
    awaySource: { sourceType: "position", group: "C", place: 2 },
  },
  {
    n_jogo: 45,
    homeSource: { sourceType: "position", group: "A", place: 3 },
    awaySource: { sourceType: "position", group: "D", place: 4 },
  },
  {
    n_jogo: 46,
    homeSource: { sourceType: "position", group: "B", place: 3 },
    awaySource: { sourceType: "position", group: "C", place: 4 },
  },
  {
    n_jogo: 47,
    homeSource: { sourceType: "position", group: "A", place: 4 },
    awaySource: { sourceType: "position", group: "D", place: 3 },
  },
  {
    n_jogo: 48,
    homeSource: { sourceType: "position", group: "B", place: 4 },
    awaySource: { sourceType: "position", group: "C", place: 3 },
  },
  {
    n_jogo: 49,
    homeSource: { sourceType: "position", group: "A", place: 5 },
    awaySource: { sourceType: "position", group: "D", place: 5 },
  },
  {
    n_jogo: 50,
    homeSource: { sourceType: "position", group: "C", place: 5 },
    awaySource: { sourceType: "position", group: "B", place: 5 },
  },
  {
    n_jogo: 51,
    homeSource: { sourceType: "position", group: "A", place: 5 },
    awaySource: { sourceType: "position", group: "C", place: 5 },
  },
  {
    n_jogo: 52,
    homeSource: { sourceType: "position", group: "D", place: 5 },
    awaySource: { sourceType: "position", group: "B", place: 5 },
  },
  {
    n_jogo: 53,
    homeSource: { sourceType: "position", group: "B", place: 5 },
    awaySource: { sourceType: "position", group: "A", place: 5 },
  },
  {
    n_jogo: 54,
    homeSource: { sourceType: "position", group: "C", place: 5 },
    awaySource: { sourceType: "position", group: "D", place: 5 },
  },
  {
    n_jogo: 55,
    homeSource: { sourceType: "match", matchNumber: 41, outcome: "winner" },
    awaySource: { sourceType: "match", matchNumber: 42, outcome: "winner" },
  },
  {
    n_jogo: 56,
    homeSource: { sourceType: "match", matchNumber: 43, outcome: "winner" },
    awaySource: { sourceType: "match", matchNumber: 44, outcome: "winner" },
  },
  {
    n_jogo: 57,
    homeSource: { sourceType: "match", matchNumber: 41, outcome: "loser" },
    awaySource: { sourceType: "match", matchNumber: 42, outcome: "loser" },
  },
  {
    n_jogo: 58,
    homeSource: { sourceType: "match", matchNumber: 43, outcome: "loser" },
    awaySource: { sourceType: "match", matchNumber: 44, outcome: "loser" },
  },
  {
    n_jogo: 59,
    homeSource: { sourceType: "match", matchNumber: 45, outcome: "winner" },
    awaySource: { sourceType: "match", matchNumber: 46, outcome: "winner" },
  },
  {
    n_jogo: 60,
    homeSource: { sourceType: "match", matchNumber: 47, outcome: "winner" },
    awaySource: { sourceType: "match", matchNumber: 48, outcome: "winner" },
  },
  {
    n_jogo: 61,
    homeSource: { sourceType: "match", matchNumber: 45, outcome: "loser" },
    awaySource: { sourceType: "match", matchNumber: 46, outcome: "loser" },
  },
  {
    n_jogo: 62,
    homeSource: { sourceType: "match", matchNumber: 47, outcome: "loser" },
    awaySource: { sourceType: "match", matchNumber: 48, outcome: "loser" },
  },
  {
    n_jogo: 63,
    homeSource: { sourceType: "match", matchNumber: 61, outcome: "loser" },
    awaySource: { sourceType: "match", matchNumber: 62, outcome: "loser" },
  },
  {
    n_jogo: 64,
    homeSource: { sourceType: "match", matchNumber: 61, outcome: "winner" },
    awaySource: { sourceType: "match", matchNumber: 62, outcome: "winner" },
  },
  {
    n_jogo: 65,
    homeSource: { sourceType: "match", matchNumber: 59, outcome: "loser" },
    awaySource: { sourceType: "match", matchNumber: 60, outcome: "loser" },
  },
  {
    n_jogo: 66,
    homeSource: { sourceType: "match", matchNumber: 59, outcome: "winner" },
    awaySource: { sourceType: "match", matchNumber: 60, outcome: "winner" },
  },
  {
    n_jogo: 67,
    homeSource: { sourceType: "match", matchNumber: 57, outcome: "loser" },
    awaySource: { sourceType: "match", matchNumber: 58, outcome: "loser" },
  },
  {
    n_jogo: 68,
    homeSource: { sourceType: "match", matchNumber: 57, outcome: "winner" },
    awaySource: { sourceType: "match", matchNumber: 58, outcome: "winner" },
  },
  {
    n_jogo: 69,
    homeSource: { sourceType: "match", matchNumber: 55, outcome: "loser" },
    awaySource: { sourceType: "match", matchNumber: 56, outcome: "loser" },
  },
  {
    n_jogo: 70,
    homeSource: { sourceType: "match", matchNumber: 55, outcome: "winner" },
    awaySource: { sourceType: "match", matchNumber: 56, outcome: "winner" },
  },
];

const buildMatchDocument = (definition) => ({
  n_jogo: definition.n_jogo,
  status: "scheduled",
  date: Date.now(),
  events: [],
  result: { homeScore: 0, awayScore: 0 },
  teams: [],
  homeSource: definition.homeSource,
  awaySource: definition.awaySource,
});

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

    const createdGames = [];
    for (const definition of finalMatchDefinitions) {
      const created = await Game.create(buildMatchDocument(definition));
      createdGames.push(created);
    }

    await resolvePendingFinalGames();

    res.status(200).json({ games: createdGames });
  } catch (error) {
    console.log("Error in generateFinalSchedule:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
