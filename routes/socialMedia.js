import { addSocialMedia, getSocialMedia} from "../controllers/socialMedia.js";
import express from "express";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

// add social Media
router.post("/add/socialmedia", authMiddleware("admin"), addSocialMedia);

// get social Media
router.get("/get/socialmedia", authMiddleware("admin"), getSocialMedia);

export default router;