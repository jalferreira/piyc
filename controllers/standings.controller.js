import Team from "../models/team.model.js";
import Game from "../models/game.model.js";

export const getGlobalStandings = async (req, res) => {
  try {
    const teams = await Team.find();
    const games = await Game.find({ status: "completed" })
      .populate("teams", "name")
      .populate("events", "type team");

    const table = teams.map((team) => ({
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

    games.forEach((game) => {
      const homeTeam = game.teams[0];
      const awayTeam = game.teams[1];
      if (!homeTeam || !awayTeam) return;

      const home = table.find((t) => t.team === homeTeam.name);
      const away = table.find((t) => t.team === awayTeam.name);
      if (!home || !away) return;

      home.played++;
      away.played++;

      const hScore = game.result?.homeScore ?? 0;
      const aScore = game.result?.awayScore ?? 0;
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

    table.sort((a, b) => {
      return (
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.cardPenalty - b.cardPenalty
      );
    });

    res.status(200).json(table);
  } catch (error) {
    console.log("Error in getStandings:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getStandingsByGroup = async (req, res) => {
  try {
    const teams = await Team.find({ group: req.body.group });
    const games = await Game.find({ status: "completed" })
      .populate("teams", "name")
      .populate("events", "type team");

    const table = teams.map((team) => ({
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

    games.forEach((game) => {
      const homeTeam = game.teams[0];
      const awayTeam = game.teams[1];
      if (!homeTeam || !awayTeam) return;

      const home = table.find((t) => t.team === homeTeam.name);
      const away = table.find((t) => t.team === awayTeam.name);
      if (!home || !away) return;

      home.played++;
      away.played++;

      const hScore = game.result?.homeScore ?? 0;
      const aScore = game.result?.awayScore ?? 0;
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

    table.sort((a, b) => {
      return (
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.cardPenalty - b.cardPenalty
      );
    });

    res.status(200).json(table);
  } catch (error) {
    console.log("Error in getStandings:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getStandingsByGroupLive = async (req, res) => {
  try {
    const teams = await Team.find({ group: req.body.group });
    const games = await Game.find()
      .populate("teams", "name")
      .populate("events", "type team");

    const table = teams.map((team) => ({
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

    games.forEach((game) => {
      const homeTeam = game.teams[0];
      const awayTeam = game.teams[1];
      if (!homeTeam || !awayTeam) return;

      const home = table.find((t) => t.team === homeTeam.name);
      const away = table.find((t) => t.team === awayTeam.name);
      if (!home || !away) return;

      home.played++;
      away.played++;

      const hScore = game.result?.homeScore ?? 0;
      const aScore = game.result?.awayScore ?? 0;
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

    table.sort((a, b) => {
      return (
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.cardPenalty - b.cardPenalty
      );
    });

    res.status(200).json(table);
  } catch (error) {
    console.log("Error in getStandings:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getStandingsLive = async (req, res) => {
  try {
    const teams = await Team.find();
    const games = await Game.find()
      .populate("teams", "name")
      .populate("events", "type team");

    const table = teams.map((team) => ({
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

    games.forEach((game) => {
      const homeTeam = game.teams[0];
      const awayTeam = game.teams[1];
      if (!homeTeam || !awayTeam) return;

      const home = table.find((t) => t.team === homeTeam.name);
      const away = table.find((t) => t.team === awayTeam.name);
      if (!home || !away) return;

      home.played++;
      away.played++;

      const hScore = game.result?.homeScore ?? 0;
      const aScore = game.result?.awayScore ?? 0;
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

    table.sort((a, b) => {
      return (
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.cardPenalty - b.cardPenalty
      );
    });

    res.status(200).json(table);
  } catch (error) {
    console.log("Error in getStandings:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
