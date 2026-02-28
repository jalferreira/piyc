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
    group: {
      type: String,
      required: false,
      default: null,
    },
  },
  { timestamps: true },
);

const Team = mongoose.model("Team", teamSchema);

export default Team;
