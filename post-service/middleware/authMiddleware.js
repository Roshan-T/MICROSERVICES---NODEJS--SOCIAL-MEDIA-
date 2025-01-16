import logger from "../utils/logger.js";

export const authenticateRequest = (req, res) => {
  const userId = req.headers["x-user-id"];
  if (!userId) {
    logger.warn(`Access attempted without user ID`);

    return res.status(401).json({
      success: false,
      message: "Autheticated required",
    });
  }
  req.user = userId;
  next();
};
