import Team from "../models/team.model.js";

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
    const groups = await Team.find().then((teams) => {
      const grouped = {};
      teams.forEach((team) => {
        if (team.group) {
          if (!grouped[team.group]) {
            grouped[team.group] = [];
          }
          grouped[team.group].push(team.name);
        }
      });
      return Object.entries(grouped).map(([name, teams]) => ({
        name,
        teams,
      }));
    });
    if (!groups || !Array.isArray(groups)) {
      return res.status(400).json({ message: "Groups array is required" });
    }

    let qualified = [];
    groups.forEach((g) => {
      if (Array.isArray(g.teams)) {
        qualified.push(
          ...g.teams
            .slice(0, 2)
            .map((team, i) => ({ team, seed: i + 1, group: g.name })),
        );
      }
    });

    if (qualified.length < 2) {
      return res
        .status(400)
        .json({ message: "Not enough qualified teams to generate bracket" });
    }

    qualified.sort((a, b) => a.seed - b.seed);

    const matches = [];
    while (qualified.length > 1) {
      const high = qualified.shift();
      const low = qualified.pop();
      matches.push({ home: high.team, away: low.team });
    }

    res.status(200).json({ matches });
  } catch (error) {
    console.log("Error in generateFinalSchedule:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
