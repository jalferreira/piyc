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
      required: true,
    },
    country: {
      type: String,
      require: true,
    },
    image: {
      type: String,
    },
  },
  { timestamps: true },
);

const Team = mongoose.model("Team", teamSchema);

export default Team;
