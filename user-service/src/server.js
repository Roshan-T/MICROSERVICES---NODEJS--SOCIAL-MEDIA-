import "dotenv/config";
import mongoose from "mongoose";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import Redis from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { rateLimit } from "express-rate-limit";

import logger from "../utils/logger.js";
import { RedisStore } from "rate-limit-redis";
const app = express();
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => logger.info("Connected to mongodb"))
  .catch(() => logger.error("Mongo connection error", e));

const redisClient = new Redis(process.env.REDIS_URL);
//DDos Protection and rate limiting
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 1,
});

app.use(helmet());

app.use(cors());

app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Recevied ${req.method} request to ${req.url}`);
  logger.info(`Request body , ${req.body}`);
});

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      logger.warn(`Rate limit exceeded fro IP : ${req.ip}`);
      res.status(429).json({ success: false, message: "Too many request" });
    });
});

const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpooint rate limit exceeded for IP : ${req.ip}`);
    res.status(429).json({ success: false, message: "Too many request" });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

//apply this sensitiveendpoint

app.use("/api/auth/register", sensitiveEndpointsLimiter);

//Routes
import routes from "../routes/userRoutes.js";
import errorHandler from "../middleware/errorHandler.js";
app.use("/api/auth", routes);

//error handler
app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  logger.info("User service running on :", PORT);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled rejection at ", promise, "reson:", reason);
});
