import Game from "../models/game.model.js";
import Team from "../models/team.model.js";

export const getStandings = async (req, res) => {
  try {
    const teams = await Team.find();
    const games = await Game.find();

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
    }));

    games.forEach((game) => {
      if (game.homeScore === undefined || game.awayScore === undefined) return;

      const home = table.find((t) => t.team === game.homeTeamName);
      const away = table.find((t) => t.team === game.awayTeamName);

      if (!home || !away) return;

      home.played++;
      away.played++;

      home.goalsFor += game.homeScore;
      home.goalsAgainst += game.awayScore;

      away.goalsFor += game.awayScore;
      away.goalsAgainst += game.homeScore;

      if (game.homeScore > game.awayScore) {
        home.wins++;
        home.points += 3;
        away.losses++;
      } else if (game.homeScore < game.awayScore) {
        away.wins++;
        away.points += 3;
        home.losses++;
      } else {
        home.draws++;
        away.draws++;
        home.points++;
        away.points++;
      }
    });

    table.forEach((t) => {
      t.goalDifference = t.goalsFor - t.goalsAgainst;
    });

    table.sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor,
    );

    res.json(table);
  } catch (error) {
    console.log("Error in getStandings:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
