import User from "../models/user.js";
import logger from "../utils/logger.js";
import validateRegistration from "../utils/validation.js";
import generateTokens from "../utils/generateToken.js";
//user registration
export const registerUser = async (req, res) => {
  logger.info("Registration endpoint hit");
  try {
    //validate the schema
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn("Validation Error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, password, username } = req.body;
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      logger.warn("User already exists");
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }
    user = new User({ username, email, password });
    await user.save();
    logger.warn("User saved succesfully", user._id);
    const { accessToken, refreshToken } = await generateTokens(user);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Registration error occcured", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
//user login

//refresh token

//logout
