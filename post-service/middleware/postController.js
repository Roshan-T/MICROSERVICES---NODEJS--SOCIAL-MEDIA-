import Post from "../models/postModel.js";
import logger from "../utils/logger.js";
import { validateCreatePost } from "../utils/validation.js";

export const createPost = async (req, res) => {
  try {
    const { error } = validateCreatePost(req.body);
    if (error) {
      logger.warn("Validation Error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { content, mediaIds } = req.body;
    const newlyCreatedPost = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });
    await newlyCreatedPost.save();
    res.status(200).json({
      sucess: true,
      message: "Post created succesfully",
    });
  } catch (error) {
    logger.error(`Error creating post , ${error}`);
    res.status(500).json({
      success: false,
      message: "Creating post error",
    });
  }
};

export const getAllPosts = async (req, res) => {
  try {
  } catch (error) {
    logger.error(`Error creating post , ${error}`);
    res.status(500).json({
      success: false,
      message: "getting posts error",
    });
  }
};

export const getPost = async (req, res) => {
  try {
  } catch (error) {
    logger.error(`Error creating post , ${error}`);
    res.status(500).json({
      success: false,
      message: "getting post error",
    });
  }
};

export const deletePost = async (req, res) => {
  try {
  } catch (error) {
    logger.error(`Error creating post , ${error}`);
    res.status(500).json({
      success: false,
      message: "deleting post error",
    });
  }
};
