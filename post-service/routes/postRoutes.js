import express from "express";
import { authenticateRequest } from "../middleware/authMiddleware.js";
import { createPost } from "../middleware/postController.js";

const router = express.Router();
router.use(authenticateRequest);

router.route("/create-post").post(createPost);

export default router;
