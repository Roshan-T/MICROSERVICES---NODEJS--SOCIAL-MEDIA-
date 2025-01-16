import "dotenv/config";
import mongoose from "mongoose";
import express from "express";
import Redis from "ioredis";
import cors from "cors";
import helmet from "helmet";
import postRoutes from "../routes/postRoutes.js";

import errorHandler from "../middleware/errorHandler.js";

import logger from "../utils/logger.js";

const PORT = process.env.PORT || 3002;
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => logger.info("Connected to mongodb"))
  .catch(() => logger.error("Mongo connection error", e));

const redisClient = new Redis(process.env.REDIS_URL);
const app = express();
app.use(helmet());

app.use(cors());

app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Recevied ${req.method} request to ${req.url}`);
  logger.info(`Request body , ${req.body}`);
  next();
});

app.use(
  "/api/posts",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  postRoutes
);

app.use(errorHandler);
app.listen(PORT, () => {
  logger.info("User service running on :", PORT);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled rejection at ", promise, "reson:", reason);
});
