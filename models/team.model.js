import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
      },
    ],
    name: {
      type: String,
      unique: true,
      required: true,
    },
    country: {
      type: String,
      require: true,
    },
    image: {
      type: String,
    },
    jogos: {
      type: Number,
      default: 0,
    },
    vitorias: {
      type: Number,
      default: 0,
    },
    derrotas: {
      type: Number,
      default: 0,
    },
    empates: {
      type: Number,
      default: 0,
    },
    pontos: {
      type: Number,
      default: 0,
    },
    marcados: {
      type: Number,
      default: 0,
    },
    sofridos: {
      type: Number,
      default: 0,
    },
    amarelos: {
      type: Number,
      default: 0,
    },
    vermelhos: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const Team = mongoose.model("Team", teamSchema);

export default Team;
