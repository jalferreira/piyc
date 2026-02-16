import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["cartao amarelo", "cartao vermelho", "golo", "autogolo"],
      required: true,
    },
    time: {
      type: Number,
      required: true,
    },
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
  },
  { timestamps: true },
);

const Event = mongoose.model("Event", eventSchema);

export default Event;
