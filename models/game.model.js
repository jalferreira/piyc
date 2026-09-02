import mongoose from "mongoose";

const sourceSchema = new mongoose.Schema(
  {
    sourceType: {
      type: String,
      enum: ["position", "match"],
      required: true,
    },
    group: {
      type: String,
    },
    place: {
      type: Number,
    },
    matchNumber: {
      type: Number,
    },
    outcome: {
      type: String,
      enum: ["winner", "loser"],
    },
  },
  { _id: false },
);

const gameSchema = new mongoose.Schema(
  {
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
    ],
    homeSource: {
      type: sourceSchema,
      required: false,
    },
    awaySource: {
      type: sourceSchema,
      required: false,
    },
    events: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true,
      },
    ],
    date: {
      type: Date,
      default: Date.now,
    },
    field: {
      type: String,
      enum: ["campo1", "campo2", "campo3"],
      required: false,
    },
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed"],
      default: "scheduled",
    },
    n_jogo: {
      type: Number,
      required: true,
    },
    result: {
      homeScore: { type: Number, default: 0, required: false },
      awayScore: { type: Number, default: 0, required: false },
      // Resultado do desempate por grandes penalidades (G.P.), quando aplicável.
      // Não conta para o resultado normal (homeScore/awayScore).
      penalties: {
        homeScore: { type: Number, required: false },
        awayScore: { type: Number, required: false },
      },
    },
    mvp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: false,
    },
    lineup: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
      },
    ],
  },
  { timestamps: true },
);

const Game = mongoose.model("Game", gameSchema);

export default Game;
