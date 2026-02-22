import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: false,
    },
    position: {
      type: String,
      enum: ["guarda-redes", "defesa", "medio", "avancado"],
      required: true,
    },
    number: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

const Player = mongoose.model("Player", playerSchema);

export default Player;
