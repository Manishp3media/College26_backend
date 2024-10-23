import { addStream, getStreams } from "../controllers/stream.js";
import express from "express";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

// Add Stream
router.post("/add/stream", authMiddleware("admin"), addStream);

// Get Streams
router.get("/get/streams", authMiddleware("admin"), getStreams);

export default router;