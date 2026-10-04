import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "cartao amarelo",
        "cartao vermelho",
        "golo",
        "autogolo",
        "penalty",
        "penalty falhado",
        "oportunidade de golo",
        "grande penalidade",
      ],
      required: true,
    },
    time: {
      type: Number,
      required: true,
    },
    // Parte do jogo (1 ou 2). Com parte, o minuto conta dentro dessa parte (sem máximo).
    // Opcional: eventos antigos e grandes penalidades não têm parte.
    half: {
      type: Number,
      enum: [1, 2],
      required: false,
    },
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true,
    },
  },
  { timestamps: true },
);

const Event = mongoose.model("Event", eventSchema);

export default Event;
