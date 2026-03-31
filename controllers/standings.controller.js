import Team from "../models/team.model.js";
import Game from "../models/game.model.js";

const createStandingsRows = (teams) =>
  teams.map((team) => ({
    teamId: team._id,
    logo: team.image,
    team: team.name,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    yellowCards: 0,
    redCards: 0,
  }));

const sortStandings = (table) =>
  table.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.cardPenalty - b.cardPenalty ||
      a.team.localeCompare(b.team),
  );

export const buildStandingsTable = (teams, games) => {
  const table = createStandingsRows(teams);

  games.forEach((game) => {
    const homeTeam = game.teams[0];
    const awayTeam = game.teams[1];
    if (!homeTeam || !awayTeam) return;

    const home = table.find((t) => t.team === homeTeam.name);
    const away = table.find((t) => t.team === awayTeam.name);
    if (!home || !away) return;

    const hScore = game.result?.homeScore ?? 0;
    const aScore = game.result?.awayScore ?? 0;

    home.played++;
    away.played++;
    home.goalsFor += hScore;
    home.goalsAgainst += aScore;
    away.goalsFor += aScore;
    away.goalsAgainst += hScore;

    if (hScore > aScore) {
      home.wins++;
      home.points += 3;
      away.losses++;
    } else if (hScore < aScore) {
      away.wins++;
      away.points += 3;
      home.losses++;
    } else {
      home.draws++;
      away.draws++;
      home.points++;
      away.points++;
    }

    game.events.forEach((evt) => {
      if (!evt.team) return;
      const isHome = evt.team.toString() === homeTeam._id.toString();
      const row = isHome ? home : away;
      if (evt.type === "cartao amarelo") row.yellowCards++;
      else if (evt.type === "cartao vermelho") row.redCards++;
    });
  });

  table.forEach((t) => {
    t.goalDifference = t.goalsFor - t.goalsAgainst;
    t.cardPenalty = t.yellowCards + t.redCards;
  });

  return sortStandings(table);
};

export const normalizeGroupLabel = (group) => {
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

export const buildGroupStandings = (teams, completedGames) => {
  const groups = {};

  teams.forEach((team) => {
    const group = normalizeGroupLabel(team.group);
    if (!group) return;

    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(team);
  });

  return Object.fromEntries(
    Object.entries(groups).map(([group, groupTeams]) => [
      group,
      buildStandingsTable(groupTeams, completedGames),
    ]),
  );
};

export const getGlobalStandings = async (req, res) => {
  try {
    const teams = await Team.find();
    const games = await Game.find({ status: "completed" })
      .populate("teams")
      .populate("events");

    const table = buildStandingsTable(teams, games);

    res.status(200).json(table);
  } catch (error) {
    console.log("Error in getStandings:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getStandingsByGroup = async (req, res) => {
  try {
    const groupFilter = req.query.group;
    const teams = await Team.find({ group: { $exists: true, $ne: null } });
    const games = await Game.find({ status: "completed" })
      .populate("teams")
      .populate("events");

    const standings = buildGroupStandings(teams, games);

    if (groupFilter) {
      const normalizedGroup = normalizeGroupLabel(groupFilter);
      return res.status(200).json({
        [normalizedGroup]: standings[normalizedGroup] || [],
      });
    }

    res.status(200).json(standings);
  } catch (error) {
    console.log("Error in getStandings:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getStandingsByGroupLive = async (req, res) => {
  try {
    const teams = await Team.find({ group: { $exists: true, $ne: null } });
    const games = await Game.find().populate("teams").populate("events");

    const standings = buildGroupStandings(teams, games);

    res.status(200).json(standings);
  } catch (error) {
    console.log("Error in getStandings:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getStandingsLive = async (req, res) => {
  try {
    const teams = await Team.find();
    const games = await Game.find().populate("teams").populate("events");

    const table = buildStandingsTable(teams, games);

    res.status(200).json(table);
  } catch (error) {
    console.log("Error in getStandings:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
