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
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed"],
      default: "scheduled",
    },
    result: {
      homeScore: { type: Number, default: 0, required: false },
      awayScore: { type: Number, default: 0, required: false },
    },
    mvp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: false,
    },
  },
  { timestamps: true },
);

const Game = mongoose.model("Game", gameSchema);

export default Game;
