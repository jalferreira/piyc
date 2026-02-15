import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
        required: true,
      },
    ],
    events: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true,
      },
    ],
  },
  { timestamps: true },
);

const Game = mongoose.model("Game", gameSchema);

export default Game;
