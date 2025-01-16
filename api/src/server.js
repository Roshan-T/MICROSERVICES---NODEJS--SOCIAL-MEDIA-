import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";

import Redis from "ioredis";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import proxy from "express-http-proxy";
const app = express();

const PORT = process.env.PORT || 3000;

const redisClient = new Redis(process.env.REDIS_URL);
import logger from "../utils/logger.js";
import errorHandler from "../middleware/errorHandler.js";
import { validateLogin } from "../../user-service/utils/validation.js";
import { validateToken } from "../middleware/authMiddleware.js";

app.use(helmet());
app.use(cors());

app.use(express.json());

const ratelimitOptions = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
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

app.use(ratelimitOptions);
app.use((req, res, next) => {
  logger.info(`Recevied ${req.method} request to ${req.url}`);
  logger.info(`Request body , ${req.body}`);
  next();
});

/*
api -> /v1/auth/register -> 3000
user-service -> /api/auth/register -> 3001

we have to use proxy to map:
localhost:3000/v1/auth/register - > localhost:3001/api/auth/register

*/

const proxyOptions = {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy error ${err.message}`);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  },
};

//setting yp proxy for our identity service

app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, cb) => {
      logger.info(
        `Response received from Identity service ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

//setting proxy for post service
app.use(
  "/v1/posts",
  validateToken,
  proxy(process.env.POST_SERVICE, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, cb) => {
      logger.info(`Response received from post service ${proxyRes.statusCode}`);
      return proxyResData;
    },
  })
);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API gateway is running on port ${PORT}`);

  logger.info(
    `Identity service is running on port ${process.env.IDENTITY_SERVICE}`
  );
  logger.info(`Redis url ${process.env.REDIS_URL}`);
});
