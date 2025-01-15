import mongoose from "mongoose";
import User from "./user.js";

const refreshTokenSchema = new mongoose.Schema(
  {
    token: {
      type: "String",
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);
/*
{ expireAfterSeconds: 0 }:

This option configures the TTL index.
expireAfterSeconds defines how many seconds after the expiresAt time the document should be removed.
A value of 0 means the document will expire exactly at the time specified in the expiresAt field.
 */
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

export default RefreshToken;
